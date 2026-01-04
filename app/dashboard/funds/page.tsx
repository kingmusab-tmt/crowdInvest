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
} from "@mui/material";
import { useSearchParams } from "next/navigation";

function a11yProps(index: number) {
  return {
    id: `funds-tab-${index}`,
    "aria-controls": `funds-tabpanel-${index}`,
  };
}

function FundsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "withdrawal" ? 1 : 0;
  const [tab, setTab] = React.useState(initialTab);
  const [amount, setAmount] = React.useState("");

  const handleSubmit = (type: "deposit" | "withdrawal") => {
    // Placeholder submission handler
    console.log(`${type} submitted:`, amount);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
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
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Deposit Funds
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
                onClick={() => handleSubmit("deposit")}
              >
                Deposit
              </Button>
            </Stack>
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
                onClick={() => handleSubmit("withdrawal")}
              >
                Withdraw
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
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
