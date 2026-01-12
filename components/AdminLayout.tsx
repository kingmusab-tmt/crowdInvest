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
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import EventIcon from "@mui/icons-material/Event";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HelpIcon from "@mui/icons-material/Help";
import SettingsIcon from "@mui/icons-material/Settings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import GroupsIcon from "@mui/icons-material/Groups";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import NotificationBell from "./NotificationBell";

const drawerWidth = 260;
const drawerCollapsedWidth = 65;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
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
});

const collapsedMixin = (theme: any) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden" as const,
  width: drawerCollapsedWidth,
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

const generalAdminMenuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: null }, // Dynamic path based on role
  { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
  { text: "Communities", icon: <GroupsIcon />, path: "/admin/communities" },
  { text: "Businesses", icon: <BusinessIcon />, path: "/admin/businesses" },
  {
    text: "Investments",
    icon: <AccountBalanceIcon />,
    path: "/admin/investments",
  },
  { text: "Proposals", icon: <HowToVoteIcon />, path: "/admin/proposals" },
  {
    text: "Transactions",
    icon: <MonetizationOnIcon />,
    path: "/admin/transactions",
  },
  { text: "Events", icon: <EventIcon />, path: "/admin/events" },
  { text: "KYC Verification", icon: <VerifiedUserIcon />, path: "/admin/kyc" },
  { text: "Assistance", icon: <HelpIcon />, path: "/admin/assistance" },
  {
    text: "Withdrawals",
    icon: <MonetizationOnIcon />,
    path: "/admin/withdrawals",
  },
  {
    text: "Manual Deposits",
    icon: <AccountBalanceIcon />,
    path: "/admin/deposits",
  },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

const communityAdminMenuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: null }, // Dynamic path based on role
  {
    text: "Community Members",
    icon: <PeopleIcon />,
    path: "/admin/community-members",
  },
  { text: "Businesses", icon: <BusinessIcon />, path: "/admin/businesses" },
  {
    text: "Investments",
    icon: <AccountBalanceIcon />,
    path: "/admin/investments",
  },
  { text: "Proposals", icon: <HowToVoteIcon />, path: "/admin/proposals" },
  {
    text: "Transactions",
    icon: <MonetizationOnIcon />,
    path: "/admin/transactions",
  },
  { text: "Events", icon: <EventIcon />, path: "/admin/events" },
  { text: "KYC Verification", icon: <VerifiedUserIcon />, path: "/admin/kyc" },
  { text: "Assistance", icon: <HelpIcon />, path: "/admin/assistance" },
  {
    text: "Withdrawals",
    icon: <MonetizationOnIcon />,
    path: "/admin/withdrawals",
  },
  {
    text: "Manual Deposits",
    icon: <AccountBalanceIcon />,
    path: "/admin/deposits",
  },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [communityName, setCommunityName] = React.useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const currentRole = session?.user?.role;

  // Desktop: open = expanded menu, closed = icon-only menu
  // Mobile: open = drawer visible, closed = drawer hidden
  const isDrawerOpen = isMobile ? mobileDrawerOpen : drawerOpen;

  React.useEffect(() => {
    if (session?.user?.role === "Community Admin" && session?.user?.community) {
      fetch(`/api/communities/${session.user.community}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setCommunityName(data.name))
        .catch(() => {});
    }
  }, [session]);

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
            {session?.user?.role === "Community Admin" && communityName
              ? `${communityName} Admin`
              : "CrowdInvest Admin"}
          </Typography>

          <NotificationBell />

          <Tooltip title="Account settings">
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar
                alt={session?.user?.name || "Admin"}
                src={session?.user?.image || ""}
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
            <MenuItem onClick={() => router.push("/admin/settings")}>
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
            {(currentRole === "Community Admin"
              ? communityAdminMenuItems
              : generalAdminMenuItems
            ).map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <ListItemButton
                  selected={
                    pathname ===
                    (item.path ||
                      (currentRole === "Community Admin"
                        ? "/admin/community"
                        : "/admin"))
                  }
                  onClick={() => {
                    if (item.text === "Dashboard") {
                      router.push(
                        currentRole === "Community Admin"
                          ? "/admin/community"
                          : "/admin"
                      );
                    } else if (item.path) {
                      router.push(item.path);
                    }
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
            {(currentRole === "Community Admin"
              ? communityAdminMenuItems
              : generalAdminMenuItems
            ).map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <Tooltip title={!drawerOpen ? item.text : ""} placement="right">
                  <ListItemButton
                    selected={
                      pathname ===
                      (item.path ||
                        (currentRole === "Community Admin"
                          ? "/admin/community"
                          : "/admin"))
                    }
                    onClick={() => {
                      if (item.text === "Dashboard") {
                        router.push(
                          currentRole === "Community Admin"
                            ? "/admin/community"
                            : "/admin"
                        );
                      } else if (item.path) {
                        router.push(item.path);
                      }
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

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
