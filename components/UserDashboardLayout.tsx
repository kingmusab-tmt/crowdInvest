"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import EventIcon from "@mui/icons-material/Event";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HelpIcon from "@mui/icons-material/Help";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";
import { formatNaira } from "@/lib/utils";

const drawerWidth = 260;
const drawerCollapsedWidth = 65;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down("md")]: {
    marginLeft: 0,
    width: "100%",
  },
  [theme.breakpoints.up("md")]: {
    marginLeft: open ? drawerWidth : drawerCollapsedWidth,
    width: `calc(100% - ${open ? drawerWidth : drawerCollapsedWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

const openedMixin = (theme: any) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden" as const,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
});

const collapsedMixin = (theme: any) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden" as const,
  width: drawerCollapsedWidth,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<{
  open: boolean;
}>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...collapsedMixin(theme),
    "& .MuiDrawer-paper": collapsedMixin(theme),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Events", icon: <EventIcon />, path: "/dashboard/events" },
  {
    text: "Investments",
    icon: <AccountBalanceIcon />,
    path: "/dashboard/investments",
  },
  {
    text: "Proposals",
    icon: <HowToVoteIcon />,
    path: "/dashboard/proposals",
  },
  { text: "Assistance", icon: <HelpIcon />, path: "/dashboard/assistance" },
  {
    text: "My Businesses",
    icon: <BusinessCenterIcon />,
    path: "/dashboard/member-businesses",
  },

  {
    text: "Funds",
    icon: <AccountBalanceWalletIcon />,
    path: "/dashboard/funds",
  },
  {
    text: "Transactions",
    icon: <MonetizationOnIcon />,
    path: "/dashboard/transactions",
  },
  // Combined Deposit and Withdrawal into a single Funds page with tabs

  {
    text: "Notifications",
    icon: <NotificationsIcon />,
    path: "/dashboard/notifications",
  },
  {
    text: "Members",
    icon: <PeopleIcon />,
    path: "/dashboard/members",
  },
  { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings" },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Desktop: open = expanded menu, closed = icon-only menu
  // Mobile: open = drawer visible, closed = drawer hidden
  const isDrawerOpen = isMobile ? mobileDrawerOpen : drawerOpen;

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDrawerOpen((prev) => !prev);
    }
  };

  const handleMobileMenuClose = () => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={isDrawerOpen}>
        <Toolbar sx={{ gap: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: { xs: 1, sm: 5 } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            CrowdInvest
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mr: 2,
              display: { xs: "none", md: "block" },
              fontSize: { sm: "0.75rem", md: "0.875rem" },
            }}
          >
            Balance: {formatNaira((session?.user as any)?.balance || 0)}
          </Typography>

          <NotificationBell />

          <Tooltip title="Account settings">
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar
                alt={session?.user?.name || "User"}
                src={session?.user?.image || ""}
                sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={() => router.push("/dashboard/settings")}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <MuiDrawer
          anchor="left"
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={handleMobileMenuClose}
          ModalProps={{ keepMounted: true }}
        >
          <DrawerHeader />
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <ListItemButton
                  selected={pathname === item.path}
                  onClick={() => {
                    router.push(item.path);
                    handleMobileMenuClose();
                  }}
                  sx={{ minHeight: 48, justifyContent: "initial", px: 2.5 }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 0, mr: 3, justifyContent: "center" }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </MuiDrawer>
      ) : (
        <Drawer anchor="left" variant="permanent" open={drawerOpen}>
          <DrawerHeader>
            {drawerOpen && (
              <IconButton onClick={handleDrawerToggle}>
                <ChevronLeftIcon />
              </IconButton>
            )}
          </DrawerHeader>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <Tooltip title={!drawerOpen ? item.text : ""} placement="right">
                  <ListItemButton
                    selected={pathname === item.path}
                    onClick={() => {
                      router.push(item.path);
                    }}
                    sx={{
                      minHeight: 48,
                      justifyContent: drawerOpen ? "initial" : "center",
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 3 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{ opacity: drawerOpen ? 1 : 0 }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: "100%" }}
      >
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
