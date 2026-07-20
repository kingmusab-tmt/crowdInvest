"use client";

import * as React from "react";
import {
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  InputAdornment,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

interface Member {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  placeOfWork?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  dateJoined: string;
  kyc?: {
    isVerified: boolean;
  };
}

// Nigerian local numbers (0XXXXXXXXXX) are normalized to international
// format (234XXXXXXXXXX) for wa.me links; +234 numbers pass through as-is.
function toWhatsAppLink(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

const contactIconStyle = (color: string) => ({
  color,
  bgcolor: `${color}14`,
  "&:hover": {
    bgcolor: `${color}26`,
  },
});

function MemberCardSkeleton() {
  return (
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={88} height={88} />
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="80%" />
          <Divider sx={{ width: "100%" }} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="70%" />
          <Stack direction="row" spacing={1}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="circular" width={32} height={32} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MembersDirectoryPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchMembers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/community-members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setFilteredMembers(data.members || []);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to load members");
      }
    } catch (err) {
      console.error("Failed to load members", err);
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.placeOfWork?.toLowerCase().includes(query) ||
          member.address?.city?.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  return (
    <Box>
      <Stack
        spacing={1}
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}
          >
            Community Members
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Connect and network with members of your community
          </Typography>
        </Box>
        {!loading && !error && (
          <Chip
            icon={<PeopleAltIcon />}
            label={`${members.length} ${
              members.length === 1 ? "Member" : "Members"
            }`}
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, mt: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 4,
          mt: 3,
          position: "sticky",
          top: { xs: 56, sm: 64 },
          zIndex: 10,
          bgcolor: "background.default",
          py: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search by name, email, workplace, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.paper",
              borderRadius: 2.5,
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "0 2px 8px rgba(0,0,0,0.3)",
            },
          }}
        />
        {!loading && members.length > 0 && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mt: 1, display: "block" }}
          >
            Showing {filteredMembers.length} of {members.length} members
          </Typography>
        )}
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <MemberCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : filteredMembers.length === 0 ? (
        <Alert severity="info">
          {searchQuery
            ? "No members found matching your search criteria."
            : "No members available in your community yet."}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredMembers.map((member) => {
            const location = [
              member.address?.city,
              member.address?.state,
              member.address?.country,
            ]
              .filter(Boolean)
              .join(", ");

            const contacts: Array<{
              key: string;
              label: string;
              href: string;
              icon: React.ReactNode;
              color: string;
            }> = [];

            if (member.whatsappNumber) {
              contacts.push({
                key: "whatsapp",
                label: "Chat on WhatsApp",
                href: toWhatsAppLink(member.whatsappNumber),
                icon: <WhatsAppIcon fontSize="small" />,
                color: "#25D366",
              });
            }
            if (member.phoneNumber) {
              contacts.push({
                key: "phone",
                label: `Call ${member.phoneNumber}`,
                href: `tel:${member.phoneNumber}`,
                icon: <PhoneIcon fontSize="small" />,
                color: "#1976d2",
              });
            }
            if (member.socialMedia?.facebook) {
              contacts.push({
                key: "facebook",
                label: "Facebook profile",
                href: member.socialMedia.facebook,
                icon: <FacebookIcon fontSize="small" />,
                color: "#1877F2",
              });
            }
            if (member.socialMedia?.twitter) {
              contacts.push({
                key: "twitter",
                label: "X (Twitter) profile",
                href: member.socialMedia.twitter,
                icon: <TwitterIcon fontSize="small" />,
                color: "#1DA1F2",
              });
            }
            if (member.socialMedia?.linkedin) {
              contacts.push({
                key: "linkedin",
                label: "LinkedIn profile",
                href: member.socialMedia.linkedin,
                icon: <LinkedInIcon fontSize="small" />,
                color: "#0A66C2",
              });
            }
            if (member.socialMedia?.instagram) {
              contacts.push({
                key: "instagram",
                label: "Instagram profile",
                href: member.socialMedia.instagram,
                icon: <InstagramIcon fontSize="small" />,
                color: "#E4405F",
              });
            }

            return (
              <Grid key={member._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                    }}
                  >
                    <Stack spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                      <Avatar
                        src={member.avatarUrl}
                        sx={{
                          width: 88,
                          height: 88,
                          fontSize: "1.75rem",
                          fontWeight: 600,
                          border: "3px solid",
                          borderColor: member.kyc?.isVerified
                            ? "success.main"
                            : "divider",
                        }}
                      >
                        {member.name?.charAt(0)}
                      </Avatar>

                      <Box sx={{ textAlign: "center" }}>
                        <Stack
                          spacing={0.5}
                          sx={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              lineHeight: 1.3,
                              wordBreak: "break-word",
                            }}
                          >
                            {member.name}
                          </Typography>
                          {member.kyc?.isVerified && (
                            <Tooltip title="KYC Verified">
                              <VerifiedIcon
                                sx={{ fontSize: 18, color: "success.main" }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            wordBreak: "break-word",
                          }}
                        >
                          {member.email}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
                      {member.placeOfWork && (
                        <Stack
                          spacing={1}
                          sx={{ flexDirection: "row", alignItems: "flex-start" }}
                        >
                          <WorkIcon
                            sx={{
                              fontSize: 18,
                              color: "text.secondary",
                              mt: "2px",
                            }}
                          />
                          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {member.placeOfWork}
                          </Typography>
                        </Stack>
                      )}

                      {location && (
                        <Stack
                          spacing={1}
                          sx={{ flexDirection: "row", alignItems: "flex-start" }}
                        >
                          <LocationOnIcon
                            sx={{
                              fontSize: 18,
                              color: "text.secondary",
                              mt: "2px",
                            }}
                          />
                          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {location}
                          </Typography>
                        </Stack>
                      )}

                      {!member.placeOfWork && !location && (
                        <Typography
                          variant="body2"
                          sx={{ color: "text.disabled", fontStyle: "italic" }}
                        >
                          No additional details provided
                        </Typography>
                      )}
                    </Stack>

                    {contacts.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Stack
                          spacing={1}
                          useFlexGap
                          sx={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {contacts.map((contact) => (
                            <Tooltip key={contact.key} title={contact.label}>
                              <IconButton
                                size="small"
                                component="a"
                                href={contact.href}
                                target={
                                  contact.href.startsWith("tel:")
                                    ? undefined
                                    : "_blank"
                                }
                                rel="noopener noreferrer"
                                sx={contactIconStyle(contact.color)}
                              >
                                {contact.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Stack>
                      </>
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        mt: 2,
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      Member since{" "}
                      {new Date(member.dateJoined).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short" }
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
