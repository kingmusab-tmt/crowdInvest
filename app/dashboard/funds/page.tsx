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
  Alert,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import AutorenewIcon from "@mui/icons-material/Autorenew";

function a11yProps(index: number) {
  return {
    id: `funds-tab-${index}`,
    "aria-controls": `funds-tabpanel-${index}`,
  };
}

function FundsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialTab = searchParams?.get("tab") === "withdrawal" ? 1 : 0;
  const [tab, setTab] = React.useState(initialTab);
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "one-time" | "reserved-account" | "recurring"
  >("one-time");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [reservedAccount, setReservedAccount] = React.useState<any>(null);
  const [recurringSetupOpen, setRecurringSetupOpen] = React.useState(false);
  const [recurringAmount, setRecurringAmount] = React.useState("");
  const [verifyingPayment, setVerifyingPayment] = React.useState(false);
  const [paymentFailures, setPaymentFailures] = React.useState<any[]>([]);
  const [recurringDetails, setRecurringDetails] = React.useState<any>(null);
  const [modifyRecurringOpen, setModifyRecurringOpen] = React.useState(false);
  const [newRecurringAmount, setNewRecurringAmount] = React.useState("");

  React.useEffect(() => {
    fetchUserPaymentSettings();
    fetchPaymentFailures();
    fetchRecurringDetails();
    verifyPaymentIfReturned();
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
            setSuccess(
              `Payment of ₦${data.amount.toLocaleString()} verified successfully! Your balance has been updated.`
            );
          } else {
            setError(data.error || "Failed to verify payment");
          }
        } else if (paymentStatus === "recurring-success") {
          // Recurring payment setup completed
          setSuccess(
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
        setError(err.message || "Failed to verify payment");
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
    setError(null);
    setSuccess(null);

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
    setError(null);
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
      setSuccess("Reserved account created successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOneTimePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

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
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRecurringSetup = async () => {
    if (!recurringAmount || parseFloat(recurringAmount) <= 0) {
      setError("Please enter a valid recurring amount");
      return;
    }

    setLoading(true);
    setError(null);

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
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCancelRecurring = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/recurring", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel recurring payment");
      }

      setSuccess("Recurring payment cancelled successfully!");
      setRecurringSetupOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Withdrawal",
          amount: parseFloat(amount),
          userName: session?.user?.name,
          userEmail: session?.user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      setSuccess("Withdrawal request submitted successfully!");
      setAmount("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRecurringCharge = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/manual-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process manual charge");
      }

      setSuccess(
        `Manual charge of ₦${data.amount.toLocaleString()} processed successfully!`
      );
      fetchRecurringDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyRecurringAmount = async () => {
    if (!newRecurringAmount || parseFloat(newRecurringAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

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

      setSuccess("Recurring amount updated successfully!");
      setModifyRecurringOpen(false);
      fetchRecurringDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (failureId: string) => {
    setLoading(true);
    setError(null);

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

      setSuccess(
        `Payment retry of ₦${data.amount.toLocaleString()} processed successfully!`
      );
      fetchPaymentFailures();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

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
                  <Alert severity="info">
                    Click "Select Payment Method" above to create your reserved
                    account
                  </Alert>
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
            <Stack spacing={2}>
              <TextField
                label="Amount (₦)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                color="warning"
                onClick={handleWithdrawal}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? "Processing..." : "Withdraw"}
              </Button>
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
                          ₦{recurringDetails.amount?.toLocaleString()}
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
                              ₦{failure.amount?.toLocaleString()}
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
