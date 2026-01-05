"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Grid,
  Stack,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TimelineIcon from "@mui/icons-material/Timeline";
import DomainIcon from "@mui/icons-material/Domain";
import ShowChartIcon from "@mui/icons-material/ShowChart";

interface MemberInvestmentCardProps {
  title: string;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  currentValue: number;
  profitOrLoss: number;
  profitOrLossPercentage: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold";
  purchaseDate: string | Date;
}

export default function MemberInvestmentCard({
  title,
  investmentType,
  basePrice,
  currentPrice,
  quantity,
  totalInvested,
  currentValue,
  profitOrLoss,
  profitOrLossPercentage,
  dividendReceived,
  status,
  purchaseDate,
}: MemberInvestmentCardProps) {
  const isProfit = profitOrLoss >= 0;
  const profitColor = isProfit ? "#4caf50" : "#f44336";
  const profitIcon = isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />;

  const getInvestmentTypeIcon = () => {
    switch (investmentType) {
      case "stock":
        return <ShowChartIcon />;
      case "business":
        return <DomainIcon />;
      case "crypto":
        return "₿";
      case "real-estate":
        return <DomainIcon />;
      default:
        return <AttachMoneyIcon />;
    }
  };

  const getInvestmentTypeLabel = () => {
    const labels: Record<string, string> = {
      stock: "Stock",
      business: "Business",
      crypto: "Cryptocurrency",
      "real-estate": "Real Estate",
    };
    return labels[investmentType] || investmentType;
  };

  const getStatusColor = () => {
    switch (status) {
      case "Active":
        return "success";
      case "Completed":
        return "warning";
      case "Sold":
        return "default";
      default:
        return "default";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${isProfit ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              {title}
            </Typography>
            <Chip
              label={getInvestmentTypeLabel()}
              size="small"
              variant="outlined"
            />
            <Chip
              label={status}
              size="small"
              color={getStatusColor() as any}
              variant="filled"
            />
          </Box>
        }
        subheader={`Purchased: ${new Date(purchaseDate).toLocaleDateString()}`}
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Price Section */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Base Price
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(basePrice)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Current Price
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: profitColor }}
              >
                {formatCurrency(currentPrice)}
              </Typography>
            </Box>
          </Grid>

          {/* Investment Amount */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Quantity
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {quantity}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Invested
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalInvested)}
              </Typography>
            </Box>
          </Grid>

          {/* Current Value */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Current Value
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(currentValue)}
              </Typography>
            </Box>
          </Grid>

          {/* Dividend */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Dividend Received
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(dividendReceived)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Profit/Loss Section */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: `${profitColor}15`,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Box sx={{ color: profitColor }}>{profitIcon}</Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Profit/Loss
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, color: profitColor }}
              >
                {formatCurrency(profitOrLoss)}
              </Typography>
            </Box>
          </Stack>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: profitColor,
              color: "white",
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            {formatPercentage(profitOrLossPercentage)}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Value Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {((currentValue / totalInvested) * 100).toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((currentValue / totalInvested) * 100, 200)}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                backgroundColor: profitColor,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 2, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption">ROI:</Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: profitColor }}
              >
                {formatPercentage(profitOrLossPercentage)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption">Total Return:</Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: profitColor }}
              >
                {formatCurrency(profitOrLoss + dividendReceived)}
              </Typography>
            </Box>
            <Tooltip title="Estimated value based on current price">
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption">Est. Liquidation:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {formatCurrency(currentValue + dividendReceived)}
                </Typography>
              </Box>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
