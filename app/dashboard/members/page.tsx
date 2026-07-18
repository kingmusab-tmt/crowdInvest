"use client";

import * as React from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useSession } from "next-auth/react";

interface Member {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
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

export default function MembersDirectoryPage() {
  const { data: session } = useSession();
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 1, fontWeight: 600, fontSize: { xs: "1.5rem", sm: "2rem" } }}
      >
        Community Members Directory
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 4
        }}>
        Connect with other members in your community
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search members..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },

            htmlInput: { style: { fontSize: "0.9rem" } }
          }} />
      </Box>
      {filteredMembers.length === 0 && !loading && (
        <Alert severity="info">
          {searchQuery
            ? "No members found matching your search criteria."
            : "No members available in your community yet."}
        </Alert>
      )}
      <Grid container spacing={3}>
        {filteredMembers.map((member) => (
          <Grid
            key={member._id}
            size={{
              xs: 12,
              sm: 6,
              md: 4
            }}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Stack spacing={2} sx={{
                  alignItems: "center"
                }}>
                  <Avatar src={member.avatarUrl} sx={{ width: 80, height: 80 }}>
                    {member.name?.charAt(0)}
                  </Avatar>

                  <Box sx={{ textAlign: "center", width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                      {member.kyc?.isVerified && (
                        <Chip
                          label="Verified"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2
                      }}>
                      {member.email}
                    </Typography>

                    {member.placeOfWork && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600
                          }}>
                          Works at
                        </Typography>
                        <Typography variant="body2">
                          {member.placeOfWork}
                        </Typography>
                      </Box>
                    )}

                    {member.phoneNumber && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600
                          }}>
                          Phone
                        </Typography>
                        <Typography variant="body2">
                          {member.phoneNumber}
                        </Typography>
                      </Box>
                    )}

                    {member.address && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600
                          }}>
                          Location
                        </Typography>
                        <Typography variant="body2">
                          {[
                            member.address.city,
                            member.address.state,
                            member.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Typography>
                      </Box>
                    )}

                    {member.socialMedia &&
                      (member.socialMedia.facebook ||
                        member.socialMedia.twitter ||
                        member.socialMedia.linkedin ||
                        member.socialMedia.instagram) && (
                        <Box sx={{ mt: 2, mb: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              display: "block",
                              mb: 1
                            }}>
                            Social Media
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              justifyContent: "center"
                            }}
                          >
                            {member.socialMedia.facebook && (
                              <Tooltip title="Facebook">
                                <IconButton
                                  size="small"
                                  href={member.socialMedia.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#1877F2" }}
                                >
                                  <FacebookIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {member.socialMedia.twitter && (
                              <Tooltip title="Twitter">
                                <IconButton
                                  size="small"
                                  href={member.socialMedia.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#1DA1F2" }}
                                >
                                  <TwitterIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {member.socialMedia.linkedin && (
                              <Tooltip title="LinkedIn">
                                <IconButton
                                  size="small"
                                  href={member.socialMedia.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#0A66C2" }}
                                >
                                  <LinkedInIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {member.socialMedia.instagram && (
                              <Tooltip title="Instagram">
                                <IconButton
                                  size="small"
                                  href={member.socialMedia.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#E4405F" }}
                                >
                                  <InstagramIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      )}

                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mt: 2,
                        display: "block"
                      }}>
                      Member since{" "}
                      {new Date(member.dateJoined).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
