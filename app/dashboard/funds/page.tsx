"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { formatNaira } from "@/lib/utils";

function a11yProps(index: number) {
  return {
    id: `funds-tab-${index}`,
    "aria-controls": `funds-tabpanel-${index}`,
  };
}

function FundsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const initialTab = searchParams?.get("tab") === "withdrawal" ? 1 : 0;
  const [tab, setTab] = React.useState(initialTab);
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "one-time" | "reserved-account" | "recurring"
  >("one-time");
  const [loading, setLoading] = React.useState(false);
  const [reservedAccount, setReservedAccount] = React.useState<any>(null);
  const [recurringSetupOpen, setRecurringSetupOpen] = React.useState(false);
  const [recurringAmount, setRecurringAmount] = React.useState("");
  const [verifyingPayment, setVerifyingPayment] = React.useState(false);
  const [paymentFailures, setPaymentFailures] = React.useState<any[]>([]);
  const [recurringDetails, setRecurringDetails] = React.useState<any>(null);
  const [modifyRecurringOpen, setModifyRecurringOpen] = React.useState(false);
  const [newRecurringAmount, setNewRecurringAmount] = React.useState("");
  const [profitShare, setProfitShare] = React.useState(0);
  const [bvnNinDialogOpen, setBvnNinDialogOpen] = React.useState(false);
  const [bvn, setBvn] = React.useState("");
  const [nin, setNin] = React.useState("");
  const [submittingBvnNin, setSubmittingBvnNin] = React.useState(false);

  React.useEffect(() => {
    fetchUserPaymentSettings();
    fetchPaymentFailures();
    fetchRecurringDetails();
    verifyPaymentIfReturned();
    fetchProfitShare();
  }, []);

  const verifyPaymentIfReturned = async () => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    const paymentStatus = params.get("payment");

    if (
      (reference || paymentStatus === "recurring-success") &&
      !verifyingPayment
    ) {
      setVerifyingPayment(true);
      try {
        if (reference) {
          // Verify one-time payment
          const response = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });

          const data = await response.json();

          if (response.ok) {
            showSuccess(
              `Payment of ${formatNaira(
                data.amount
              )} verified successfully! Your balance has been updated.`
            );
          } else {
            showError(data.error || "Failed to verify payment");
          }
        } else if (paymentStatus === "recurring-success") {
          // Recurring payment setup completed
          showSuccess(
            "Recurring payment setup successful! Your first charge will process on the scheduled date."
          );
          // Refetch recurring details
          fetchRecurringDetails();
        }

        // Clear the URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        // Refresh user data
        fetchUserPaymentSettings();
      } catch (err: any) {
        showError(err.message || "Failed to verify payment");
      } finally {
        setVerifyingPayment(false);
      }
    }
  };

  const fetchUserPaymentSettings = async () => {
    try {
      const response = await fetch(`/api/users?email=${session?.user?.email}`);
      const userData = await response.json();
      if (userData.length > 0 && userData[0].paymentSettings) {
        const settings = userData[0].paymentSettings;
        if (settings.preferredPaymentMethod) {
          setPaymentMethod(settings.preferredPaymentMethod);
        }
        if (settings.reservedAccountNumber) {
          setReservedAccount({
            accountNumber: settings.reservedAccountNumber,
            accountName: settings.reservedAccountName,
            bankName: settings.reservedAccountBank,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
    }
  };

  const fetchPaymentFailures = async () => {
    try {
      const response = await fetch("/api/payment/retry");
      const data = await response.json();
      if (response.ok) {
        setPaymentFailures(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment failures:", error);
    }
  };

  const fetchRecurringDetails = async () => {
    try {
      const response = await fetch("/api/payment/recurring-details");
      const data = await response.json();
      if (response.ok) {
        setRecurringDetails(data);
        setNewRecurringAmount((data.amount || 0).toString());
      }
    } catch (error) {
      console.error("Failed to fetch recurring details:", error);
    }
  };

  const handlePaymentMethodChange = async (
    method: "one-time" | "reserved-account" | "recurring"
  ) => {
    setPaymentMethod(method);

    // If reserved account is selected and not yet created, create it
    if (method === "reserved-account" && !reservedAccount) {
      await createReservedAccount();
    }

    // If recurring is selected, open setup dialog
    if (method === "recurring") {
      setRecurringSetupOpen(true);
    }
  };

  const createReservedAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/reserved-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reserved account");
      }

      setReservedAccount(data.account);
      showSuccess("Reserved account created successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOneTimePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          email: session?.user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (err: any) {
      showError(err.message);
      setLoading(false);
    }
  };

  const handleRecurringSetup = async () => {
    if (!recurringAmount || parseFloat(recurringAmount) <= 0) {
      showError("Please enter a valid recurring amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(recurringAmount),
          email: session?.user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup recurring payment");
      }

      // Redirect to Paystack to authorize recurring payment
      window.location.href = data.authorization_url;
    } catch (err: any) {
      showError(err.message);
      setLoading(false);
    }
  };

  const handleCancelRecurring = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/payment/recurring", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel recurring payment");
      }

      showSuccess("Recurring payment cancelled successfully!");
      setRecurringSetupOpen(false);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitShare = async () => {
    try {
      const transactionsRes = await fetch("/api/transactions");
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();

        // Calculate member's profit share from actual Profit Share transactions
        // Positive amounts = profit distributions, Negative amounts = withdrawals/contributions
        const memberProfitShareTransactions = transactionsData.filter(
          (t: any) =>
            t.userEmail === session?.user?.email &&
            t.type === "Profit Share" &&
            t.status === "Completed"
        );
        const availableProfitShare = memberProfitShareTransactions.reduce(
          (sum: number, t: any) => sum + t.amount,
          0
        );

        setProfitShare(availableProfitShare);
      }
    } catch (error) {
      console.error("Error fetching profit share:", error);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const withdrawalAmount = parseFloat(amount);

    // Check if withdrawal amount is within available profit share
    if (withdrawalAmount > profitShare) {
      showError(
        `Insufficient profit share. You can withdraw up to ${formatNaira(
          profitShare
        )}`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawalAmount,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
          communityId: session?.user?.community,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal request");
      }

      showSuccess(
        `Withdrawal request of ${formatNaira(
          withdrawalAmount
        )} submitted successfully! Please wait for admin approval.`
      );
      setAmount("");
      fetchProfitShare(); // Refresh profit share
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const contributionAmount = parseFloat(amount);

    // Check if contribution amount is within available profit share
    if (contributionAmount > profitShare) {
      showError(
        `Insufficient profit share. You can contribute up to ${formatNaira(
          profitShare
        )}`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contributions/from-profit-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: contributionAmount,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
          communityId: session?.user?.community,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process contribution");
      }

      showSuccess(
        `Successfully contributed ${formatNaira(
          contributionAmount
        )} from your profit share!`
      );
      setAmount("");
      fetchProfitShare(); // Refresh profit share
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRecurringCharge = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/payment/manual-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process manual charge");
      }

      showSuccess(
        `Manual charge of ${formatNaira(data.amount)} processed successfully!`
      );
      fetchRecurringDetails();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyRecurringAmount = async () => {
    if (!newRecurringAmount || parseFloat(newRecurringAmount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment/recurring-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newAmount: parseFloat(newRecurringAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to modify recurring amount");
      }

      showSuccess("Recurring amount updated successfully!");
      setModifyRecurringOpen(false);
      fetchRecurringDetails();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (failureId: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/payment/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failureId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to retry payment");
      }

      showSuccess(
        `Payment retry of ${formatNaira(data.amount)} processed successfully!`
      );
      fetchPaymentFailures();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBvnNin = async () => {
    if (!bvn || !nin) {
      showError("Please enter both BVN and NIN");
      return;
    }

    if (bvn.length !== 11) {
      showError("BVN must be 11 digits");
      return;
    }

    if (nin.length !== 11) {
      showError("NIN must be 11 digits");
      return;
    }

    setSubmittingBvnNin(true);

    try {
      const response = await fetch("/api/users/update-bvn-nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvn, nin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit BVN/NIN");
      }

      showSuccess(
        "BVN and NIN submitted successfully! Your reserved account will be created shortly."
      );
      setBvn("");
      setNin("");
      setBvnNinDialogOpen(false);
      // Refresh user data or reserved account
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmittingBvnNin(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 } }}
    >
      {verifyingPayment && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: "info.lighter",
            borderRadius: 1,
          }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" color="info.main">
            Verifying your payment...
          </Typography>
        </Box>
      )}

      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Funds
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your deposits and withdrawals in one place.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          aria-label="funds tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Deposit" {...a11yProps(0)} />
          <Tab label="Withdrawal" {...a11yProps(1)} />
          <Tab label="Recurring Payments" {...a11yProps(2)} />
          <Tab label="Failed Payments" {...a11yProps(3)} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Deposit Funds
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                Select Payment Method
              </FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) =>
                  handlePaymentMethodChange(
                    e.target.value as
                      | "one-time"
                      | "reserved-account"
                      | "recurring"
                  )
                }
              >
                <Card
                  variant="outlined"
                  sx={{
                    mb: 2,
                    cursor: "pointer",
                    borderColor:
                      paymentMethod === "one-time" ? "primary.main" : "divider",
                    bgcolor:
                      paymentMethod === "one-time"
                        ? "primary.lighter"
                        : "transparent",
                  }}
                  onClick={() => handlePaymentMethodChange("one-time")}
                >
                  <CardContent>
                    <FormControlLabel
                      value="one-time"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PaymentIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              One-Time Payment
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Make instant payments using Paystack
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    mb: 2,
                    cursor: "pointer",
                    borderColor:
                      paymentMethod === "reserved-account"
                        ? "primary.main"
                        : "divider",
                    bgcolor:
                      paymentMethod === "reserved-account"
                        ? "primary.lighter"
                        : "transparent",
                  }}
                  onClick={() => handlePaymentMethodChange("reserved-account")}
                >
                  <CardContent>
                    <FormControlLabel
                      value="reserved-account"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AccountBalanceIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Reserved Account
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Get a dedicated account number for automatic
                              deposits
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    borderColor:
                      paymentMethod === "recurring"
                        ? "primary.main"
                        : "divider",
                    bgcolor:
                      paymentMethod === "recurring"
                        ? "primary.lighter"
                        : "transparent",
                  }}
                  onClick={() => handlePaymentMethodChange("recurring")}
                >
                  <CardContent>
                    <FormControlLabel
                      value="recurring"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AutorenewIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Recurring Payment
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Set up automatic monthly contributions
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {paymentMethod === "one-time" && (
              <Stack spacing={2}>
                <TextField
                  label="Amount (₦)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  required
                />
                <Button
                  variant="contained"
                  onClick={handleOneTimePayment}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? "Processing..." : "Pay with Paystack"}
                </Button>
              </Stack>
            )}

            {paymentMethod === "reserved-account" && (
              <Box>
                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : reservedAccount ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Your Reserved Account
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Transfer funds to this account and it will automatically
                        reflect in your dashboard
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Account Number
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {reservedAccount.accountNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Account Name
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {reservedAccount.accountName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Bank Name
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {reservedAccount.bankName}
                          </Typography>
                        </Box>
                      </Stack>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        This account is exclusively for your contributions. Any
                        transfer to this account will be credited automatically.
                      </Alert>
                    </CardContent>
                  </Card>
                ) : (
                  <Stack spacing={2}>
                    <Alert severity="warning">
                      To create a reserved account, you need to provide your BVN
                      (Bank Verification Number) and NIN (National
                      Identification Number) as required by CBN regulations.
                    </Alert>
                    <Button
                      variant="contained"
                      onClick={() => setBvnNinDialogOpen(true)}
                      fullWidth
                    >
                      Request Reserved Account
                    </Button>
                  </Stack>
                )}
              </Box>
            )}

            {paymentMethod === "recurring" && (
              <Alert severity="info">
                Click "Setup Recurring Payment" to configure automatic monthly
                contributions
              </Alert>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Withdraw Funds
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Available Profit Share:{" "}
              <strong>{formatNaira(profitShare)}</strong>
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You can only withdraw from your profit share. Your withdrawal
              request will be sent to the admin for approval.
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Amount (₦)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                helperText={`Maximum: ${formatNaira(profitShare)}`}
                inputProps={{ max: profitShare, min: 0, step: "0.01" }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleWithdrawal}
                  disabled={loading || profitShare <= 0}
                  startIcon={loading && <CircularProgress size={20} />}
                  fullWidth
                >
                  {loading ? "Processing..." : "Request Withdrawal"}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleContribute}
                  disabled={loading || profitShare <= 0}
                  startIcon={loading && <CircularProgress size={20} />}
                  fullWidth
                >
                  {loading ? "Processing..." : "Contribute"}
                </Button>
              </Box>
            </Stack>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recurring Payment Management
            </Typography>
            {recurringDetails ? (
              <Stack spacing={2}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Active Monthly Amount
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {formatNaira(recurringDetails.amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Next Charge Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            recurringDetails.nextChargeDate
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Subscription Status
                        </Typography>
                        <Typography variant="body1">Active</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => setModifyRecurringOpen(true)}
                    fullWidth
                  >
                    Modify Amount
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleManualRecurringCharge}
                    disabled={loading}
                  >
                    Charge Now
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Alert severity="info">
                No active recurring payment. Set up recurring payments on the
                Deposit tab.
              </Alert>
            )}
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Failed Payments
            </Typography>
            {paymentFailures.length > 0 ? (
              <Stack spacing={2}>
                {paymentFailures.map((failure: any) => (
                  <Card key={failure._id}>
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {formatNaira(failure.amount)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {failure.type} payment
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: "#fff3cd",
                                color: "#856404",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              Attempt {failure.retryCount}/3
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="error.main">
                          Reason: {failure.reason}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Failed:{" "}
                          {new Date(failure.failedAt).toLocaleDateString()}
                        </Typography>
                        {failure.nextRetryDate && (
                          <Typography variant="caption" color="text.secondary">
                            Next auto-retry:{" "}
                            {new Date(
                              failure.nextRetryDate
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => handleRetryPayment(failure._id)}
                          disabled={
                            loading || failure.retryCount >= failure.maxRetries
                          }
                        >
                          {loading ? "Retrying..." : "Retry Now"}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Alert severity="success">No failed payments. All good!</Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Recurring Payment Setup Dialog */}
      <Dialog
        open={recurringSetupOpen}
        onClose={() => setRecurringSetupOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Setup Recurring Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set up automatic monthly contributions. You will be charged on the
            same day each month.
          </Typography>
          <TextField
            label="Monthly Amount (₦)"
            type="number"
            value={recurringAmount}
            onChange={(e) => setRecurringAmount(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecurringSetupOpen(false)}>Cancel</Button>
          <Button onClick={handleCancelRecurring} color="error">
            Cancel Recurring
          </Button>
          <Button
            onClick={handleRecurringSetup}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Processing..." : "Setup Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify Recurring Amount Dialog */}
      <Dialog
        open={modifyRecurringOpen}
        onClose={() => setModifyRecurringOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modify Recurring Amount</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your monthly contribution amount. Changes will take effect
            from the next billing cycle.
          </Typography>
          <TextField
            label="New Monthly Amount (₦)"
            type="number"
            value={newRecurringAmount}
            onChange={(e) => setNewRecurringAmount(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModifyRecurringOpen(false)}>Cancel</Button>
          <Button
            onClick={handleModifyRecurringAmount}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Amount"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BVN/NIN Dialog for Reserved Account */}
      <Dialog
        open={bvnNinDialogOpen}
        onClose={() => setBvnNinDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Reserved Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide your BVN and NIN as required by CBN regulations for
            virtual account creation. These are 11-digit numbers.
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="BVN (Bank Verification Number)"
              type="text"
              value={bvn}
              onChange={(e) =>
                setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="11 digits"
              fullWidth
              required
              inputProps={{ maxLength: 11, pattern: "[0-9]{11}" }}
              helperText={`${bvn.length}/11 digits`}
            />
            <TextField
              label="NIN (National Identification Number)"
              type="text"
              value={nin}
              onChange={(e) =>
                setNin(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="11 digits"
              fullWidth
              required
              inputProps={{ maxLength: 11, pattern: "[0-9]{11}" }}
              helperText={`${nin.length}/11 digits`}
            />
          </Stack>
          <Alert severity="info" sx={{ mt: 3 }}>
            Your BVN and NIN are required by the Central Bank of Nigeria (CBN)
            for virtual account operations and will be securely stored.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBvnNinDialogOpen(false)}
            disabled={submittingBvnNin}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitBvnNin}
            variant="contained"
            disabled={
              submittingBvnNin || bvn.length !== 11 || nin.length !== 11
            }
          >
            {submittingBvnNin ? "Submitting..." : "Submit & Create Account"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alert */}
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}
export default function FundsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}>Loading...</Box>}>
      <FundsContent />
    </Suspense>
  );
}
