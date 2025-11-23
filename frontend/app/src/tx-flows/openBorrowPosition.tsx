import type { FlowDeclaration, FlowParams } from "@/src/services/TransactionFlow";
import type { Address } from "@/src/types";

import { Amount } from "@/src/comps/Amount/Amount";
import { ETH_GAS_COMPENSATION } from "@/src/constants";
import { dnum18 } from "@/src/dnum-utils";
import { fmtnum } from "@/src/formatting";
import {
  getBranch,
  getCollToken,
  getTroveOperationHints,
  useInterestBatchDelegate,
  usePredictOpenTroveUpfrontFee,
} from "@/src/liquity-utils";
import { AccountButton } from "@/src/screens/TransactionsScreen/AccountButton";
import { LoanCard } from "@/src/screens/TransactionsScreen/LoanCard";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { getIndexedTroveById } from "@/src/subgraph";
import { sleep } from "@/src/utils";
import { vAddress, vBranchId, vDnum } from "@/src/valibot-utils";
import { css } from "@/styled-system/css";
import { ADDRESS_ZERO, InfoTooltip } from "@liquity2/uikit";
import * as dn from "dnum";
import * as v from "valibot";
import { maxUint256, parseEventLogs } from "viem";
import { readContract } from "wagmi/actions";
import { createRequestSchema, verifyTransaction } from "./shared";
import { WHITE_LABEL_CONFIG } from "@/src/white-label.config";

const RequestSchema = createRequestSchema(
  "openBorrowPosition",
  {
    branchId: vBranchId(),
    owner: vAddress(),
    ownerIndex: v.number(),
    collAmount: vDnum(),
    boldAmount: vDnum(),
    annualInterestRate: vDnum(),
    maxUpfrontFee: vDnum(),
    interestRateDelegate: v.union([v.null(), vAddress()]),
  },
);

export function convert18ToDecimals(
  amount: bigint,
  decimals: number,
  round: "down" | "up" = "down",
): bigint {
  const divisor = 10n ** BigInt(18 - decimals);
  if (round === "down") {
    return amount / divisor; // Integer division truncates (rounds down)
  } else {
    // Round up: (amount + divisor - 1) / divisor
    return (amount + divisor - 1n) / divisor;
  }
}

export type OpenBorrowPositionRequest = v.InferOutput<typeof RequestSchema>;

async function resolveBorrowController(ctx: FlowParams<OpenBorrowPositionRequest>) {
  const branch = getBranch(ctx.request.branchId);

  const zapperAddress = branch.decimals < 18
    ? branch.contracts.LeverageWrappedTokenZapper.address
    : branch.contracts.LeverageLSTZapper.address;

  const txCollAmount = branch.decimals < 18
    ? convert18ToDecimals(ctx.request.collAmount[0], branch.decimals, "down")
    : ctx.request.collAmount[0];

  let useBorrowerOperations = zapperAddress === ADDRESS_ZERO;

  if (!useBorrowerOperations) {
    try {
      const zapperAllowance = await readContract(ctx.wagmiConfig, {
        ...branch.contracts.CollToken,
        functionName: "allowance",
        args: [zapperAddress, branch.contracts.BorrowerOperations.address],
      });
      useBorrowerOperations ||= zapperAllowance < txCollAmount;
    } catch (error) {
      console.warn("Failed to read zapper allowance, falling back to BorrowerOperations:", error);
      useBorrowerOperations = true;
    }
  }

  const controllerAddress: Address = useBorrowerOperations
    ? branch.contracts.BorrowerOperations.address
    : zapperAddress;

  return {
    branch,
    controllerAddress,
    txCollAmount,
    useBorrowerOperations,
    zapperAddress,
  };
}

export const openBorrowPosition: FlowDeclaration<OpenBorrowPositionRequest> = {
  title: "Review & Send Transaction",

  Summary({ request }) {
    const upfrontFee = usePredictOpenTroveUpfrontFee(
      request.branchId,
      request.boldAmount,
      request.interestRateDelegate ?? request.annualInterestRate,
    );

    const boldAmountWithFee = upfrontFee.data && dn.add(
      request.boldAmount,
      upfrontFee.data,
    );

    return (
      <LoanCard
        leverageMode={false}
        loadingState="success"
        loan={{
          type: "borrow",
          status: "active",
          troveId: null,
          borrower: request.owner,
          batchManager: request.interestRateDelegate,
          borrowed: boldAmountWithFee ?? dnum18(0),
          branchId: request.branchId,
          deposit: request.collAmount,
          interestRate: request.annualInterestRate,
        }}
        onRetry={() => {}}
        txPreviewMode
      />
    );
  },

  Details({ request }) {
    const collateral = getCollToken(request.branchId);
    const collPrice = usePrice(collateral.symbol);

    const upfrontFee = usePredictOpenTroveUpfrontFee(
      request.branchId,
      request.boldAmount,
      request.interestRateDelegate ?? request.annualInterestRate,
    );

    const boldAmountWithFee = upfrontFee.data && dn.add(
      request.boldAmount,
      upfrontFee.data,
    );

    const { branchId, interestRateDelegate, boldAmount } = request;
    const delegate = useInterestBatchDelegate(branchId, interestRateDelegate);
    const yearlyBoldInterest = dn.mul(
      boldAmount,
      dn.add(request.annualInterestRate, delegate.data?.fee ?? 0),
    );

    return collateral && (
      <>
        <TransactionDetailsRow
          label="Collateral"
          value={[
            `${fmtnum(request.collAmount)} ${collateral.name}`,
            <Amount
              key="end"
              fallback="…"
              prefix="$"
              value={collPrice.data && dn.mul(request.collAmount, collPrice.data)}
            />,
          ]}
        />
        <TransactionDetailsRow
          label="Loan"
          value={[
            <Amount
              key="start"
              fallback="…"
              value={boldAmountWithFee}
              suffix={` ${WHITE_LABEL_CONFIG.tokens.mainToken.symbol}`}
            />,
            <div
              key="end"
              className={css({
                display: "flex",
                alignItems: "center",
                gap: 4,
              })}
            >
              <Amount
                fallback="…"
                prefix="Incl. "
                value={upfrontFee.data}
                suffix={` ${WHITE_LABEL_CONFIG.tokens.mainToken.symbol} creation fee`}
              />
              <InfoTooltip heading={`${WHITE_LABEL_CONFIG.tokens.mainToken.symbol} Creation Fee`}>
                This fee is charged when you open a new loan or increase your debt. It corresponds to 7 days of average
                interest for the respective collateral asset.
              </InfoTooltip>
            </div>,
          ]}
        />
        {request.interestRateDelegate
          ? (
            <TransactionDetailsRow
              label="Interest rate delegate"
              value={[
                <AccountButton
                  key="start"
                  address={request.interestRateDelegate}
                />,
                <div key="end">
                  {delegate.isLoading
                    ? "Loading…"
                    : (
                      <>
                        <Amount
                          value={request.annualInterestRate}
                          format="pct2z"
                          percentage
                        />{" "}
                        <Amount
                          percentage
                          format="pct2"
                          prefix="+ "
                          suffix="% delegate fee"
                          fallback="…"
                          value={delegate.data?.fee}
                        />
                        <br />
                        <Amount
                          format="2z"
                          prefix="~"
                          suffix={` ${WHITE_LABEL_CONFIG.tokens.mainToken.symbol} per year`}
                          value={yearlyBoldInterest}
                        />
                      </>
                    )}
                </div>,
              ]}
            />
          )
          : (
            <TransactionDetailsRow
              label="Interest rate"
              value={[
                <Amount
                  key="start"
                  value={request.annualInterestRate}
                  percentage
                />,
                <Amount
                  key="end"
                  fallback="…"
                  value={boldAmountWithFee && dn.mul(
                    boldAmountWithFee,
                    request.annualInterestRate,
                  )}
                  suffix={` ${WHITE_LABEL_CONFIG.tokens.mainToken.symbol} per year`}
                />,
              ]}
            />
          )}
        <TransactionDetailsRow
          label="Refundable gas deposit"
          value={[
            <div
              key="start"
              title={`${fmtnum(ETH_GAS_COMPENSATION, "full")} ETH`}
            >
              {fmtnum(ETH_GAS_COMPENSATION, 4)} ETH
            </div>,
            "Only used in case of liquidation",
          ]}
        />
      </>
    );
  },

  steps: {
    // Reset approval to 0 (required for some tokens like USDT when changing existing approval)
    resetApprovalLst: {
      name: (ctx) => {
        const branch = getBranch(ctx.request.branchId);
        return `Reset ${branch.symbol} Approval`;
      },
      Status: (props) => (
        <TransactionStatus
          {...props}
          approval="approve-only"
        />
      ),
      async commit(ctx) {
        const { branch, controllerAddress } = await resolveBorrowController(ctx);
        const { CollToken } = branch.contracts;

        return ctx.writeContract({
          ...CollToken,
          functionName: "approve",
          args: [
            controllerAddress,
            0n, // Reset to 0
          ],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    // Approve LST
    approveLst: {
      name: (ctx) => {
        const branch = getBranch(ctx.request.branchId);
        return `Approve ${branch.symbol}`;
      },
      Status: (props) => (
        <TransactionStatus
          {...props}
          approval="approve-only"
        />
      ),
      async commit(ctx) {
        const { branch, controllerAddress } = await resolveBorrowController(ctx);
        const { CollToken } = branch.contracts;

        const approvalAmount = ctx.preferredApproveMethod === "approve-infinite"
          ? maxUint256
          : (branch.decimals < 18 ? convert18ToDecimals(ctx.request.collAmount[0], branch.decimals, "up") : ctx.request.collAmount[0]);

        console.log("🔍 APPROVAL DEBUG:", {
          preferredMethod: ctx.preferredApproveMethod,
          collAmount: ctx.request.collAmount[0].toString(),
          approvalAmount: approvalAmount.toString(),
          branchDecimals: branch.decimals,
        });

        return ctx.writeContract({
          ...CollToken,
          functionName: "approve",
          args: [
            controllerAddress,
            approvalAmount, // exact amount (round up for safety)
          ],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    // LeverageLSTZapper mode
    openTroveLst: {
      name: () => "Open Position",
      Status: TransactionStatus,

      async commit(ctx) {
        const { upperHint, lowerHint } = await getTroveOperationHints({
          wagmiConfig: ctx.wagmiConfig,
          contracts: ctx.contracts,
          branchId: ctx.request.branchId,
          interestRate: ctx.request.annualInterestRate[0],
        });

        const {
          branch,
          controllerAddress,
          txCollAmount,
          useBorrowerOperations,
        } = await resolveBorrowController(ctx);

        console.log("🔍 TRANSACTION DEBUG:", {
          collAmount: ctx.request.collAmount[0].toString(),
          txCollAmount: txCollAmount.toString(),
          branchDecimals: branch.decimals,
          controller: controllerAddress,
          useBorrowerOperations,
        });

        if (useBorrowerOperations) {
          if (ctx.request.interestRateDelegate) {
            return ctx.writeContract({
              ...branch.contracts.BorrowerOperations,
              functionName: "openTroveAndJoinInterestBatchManager",
              args: [{
                owner: ctx.request.owner,
                ownerIndex: BigInt(ctx.request.ownerIndex),
                collAmount: txCollAmount,
                boldAmount: ctx.request.boldAmount[0],
                upperHint,
                lowerHint,
                interestBatchManager: ctx.request.interestRateDelegate,
                maxUpfrontFee: ctx.request.maxUpfrontFee[0],
                addManager: ADDRESS_ZERO,
                removeManager: ADDRESS_ZERO,
                receiver: ADDRESS_ZERO,
              }],
            });
          }

          return ctx.writeContract({
            ...branch.contracts.BorrowerOperations,
            functionName: "openTrove",
            args: [
              ctx.request.owner,
              BigInt(ctx.request.ownerIndex),
              txCollAmount,
              ctx.request.boldAmount[0],
              upperHint,
              lowerHint,
              ctx.request.annualInterestRate[0],
              ctx.request.maxUpfrontFee[0],
              ADDRESS_ZERO,
              ADDRESS_ZERO,
              ADDRESS_ZERO,
            ],
          });
        }

        return ctx.writeContract({
          ...(branch.decimals < 18 ? branch.contracts.LeverageWrappedTokenZapper : branch.contracts.LeverageLSTZapper),
          functionName: "openTroveWithRawETH" as const,
          args: [{
            owner: ctx.request.owner,
            ownerIndex: BigInt(ctx.request.ownerIndex),
            collAmount: txCollAmount,
            boldAmount: ctx.request.boldAmount[0],
            upperHint,
            lowerHint,
            annualInterestRate: ctx.request.interestRateDelegate
              ? 0n
              : ctx.request.annualInterestRate[0],
            batchManager: ctx.request.interestRateDelegate
              ? ctx.request.interestRateDelegate
              : ADDRESS_ZERO,
            maxUpfrontFee: ctx.request.maxUpfrontFee[0],
            addManager: ADDRESS_ZERO,
            removeManager: ADDRESS_ZERO,
            receiver: ADDRESS_ZERO,
          }],
          // value: ETH_GAS_COMPENSATION[0],
        });
      },

      async verify(ctx, hash) {
        const receipt = await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);

        // extract trove ID from logs
        const branch = getBranch(ctx.request.branchId);
        const [troveOperation] = parseEventLogs({
          abi: branch.contracts.TroveManager.abi,
          logs: receipt.logs,
          eventName: "TroveOperation",
        });

        if (!troveOperation?.args?._troveId) {
          throw new Error("Failed to extract trove ID from transaction");
        }

        // wait for the trove to appear in the subgraph
        while (true) {
          const trove = await getIndexedTroveById(
            branch.branchId,
            `0x${troveOperation.args._troveId.toString(16)}`,
          );
          if (trove !== null) {
            break;
          }
          await sleep(1000);
        }
      },
    },

    // LeverageWETHZapper mode
    // openTroveEth: {
    //   name: () => "Open Position",
    //   Status: TransactionStatus,

    //   async commit(ctx) {
    //     const { upperHint, lowerHint } = await getTroveOperationHints({
    //       wagmiConfig: ctx.wagmiConfig,
    //       contracts: ctx.contracts,
    //       branchId: ctx.request.branchId,
    //       interestRate: ctx.request.annualInterestRate[0],
    //     });

    //     const branch = getBranch(ctx.request.branchId);
    //     return ctx.writeContract({
    //       ...branch.contracts.LeverageWETHZapper,
    //       functionName: "openTroveWithRawETH",
    //       args: [{
    //         owner: ctx.request.owner,
    //         ownerIndex: BigInt(ctx.request.ownerIndex),
    //         collAmount: 0n,
    //         boldAmount: ctx.request.boldAmount[0],
    //         upperHint,
    //         lowerHint,
    //         annualInterestRate: ctx.request.interestRateDelegate
    //           ? 0n
    //           : ctx.request.annualInterestRate[0],
    //         batchManager: ctx.request.interestRateDelegate
    //           ? ctx.request.interestRateDelegate
    //           : ADDRESS_ZERO,
    //         maxUpfrontFee: ctx.request.maxUpfrontFee[0],
    //         addManager: ADDRESS_ZERO,
    //         removeManager: ADDRESS_ZERO,
    //         receiver: ADDRESS_ZERO,
    //       }],
    //       value: ctx.request.collAmount[0] + ETH_GAS_COMPENSATION[0],
    //     });
    //   },

    //   async verify(...args) {
    //     // same verification as openTroveLst
    //     return openBorrowPosition.steps.openTroveLst?.verify(...args);
    //   },
    // },
  },

  async getSteps(ctx) {
    const { branch, controllerAddress } = await resolveBorrowController(ctx);

    // // ETH doesn't need approval
    // if (branch.symbol === "ETH") {
    //   return ["openTroveEth"];
    // }

    // Check if approval is needed
    const allowance = await readContract(ctx.wagmiConfig, {
      ...branch.contracts.CollToken,
      functionName: "allowance",
      args: [ctx.account, controllerAddress],
    });

    const steps: string[] = [];

    // Check allowance against the approval amount (with "up" rounding) to ensure sufficient approval
    const requiredApproval = branch.decimals < 18
      ? convert18ToDecimals(ctx.request.collAmount[0], branch.decimals, "up")
      : ctx.request.collAmount[0];

    if (allowance < requiredApproval) {
      // If there's an existing non-zero allowance, reset it to 0 first
      // This is required for some tokens (like USDT) when changing approval
      if (allowance > 0n) {
        steps.push("resetApprovalLst");
      }
      steps.push("approveLst");
    }

    steps.push("openTroveLst");
    return steps;
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
