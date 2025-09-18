import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Person,
  Phone,
  CreditCard,
  Search,
  ContentCopy,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import CryptoJS from 'crypto-js';

// Your secure AES key should be managed securely - here for demo only
const AES_SECRET_KEY = 'your_base64_or_hex_encoded_key_here';

// Mock data for demonstration (replace with Firebase integration)
const mockUsers = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: 'U2FsdGVkX1+vP59nYoB0Qq7yLrX8QGqkoB/KKu1fDxSUHw==', // encrypted base64
    aadhaar: 'U2FsdGVkX18Fx0nVj5HgEZH50/kUMb5hZAjG9NgsxII=', // encrypted base64
    maskedAadhaar: '******5432',
    blockchainHash: 'a1b2c3d4e5f6789012345678901234567',
    status: 'active',
    signupDate: '2025-09-10T10:30:00.000Z',
    lastLogin: '2025-09-13T08:15:00.000Z'
  },
  // other users...
];

function decryptAES(encryptedBase64) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedBase64, AES_SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('AES Decryption failed:', e);
    return '***';
  }
}

function UserManager() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);

    // TODO: Replace with Firebase onSnapshot to get real data and decrypt here
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decryptAES(user.phone).includes(searchTerm) ||
      user.blockchainHash.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const truncateHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                Users Management
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={1}>
                Monitor active users with encrypted sensitive data and blockchain IDs
              </Typography>
            </Box>
            <TextField
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 320 }}
              size="small"
            />
          </Box>

          {/* Success Alert */}
          {copySuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCopySuccess('')}>
              {copySuccess}
            </Alert>
          )}

          {/* Stats Cards */}
          <Box display="flex" gap={2} mb={3}>
            <Card variant="outlined" sx={{ flex: 1, bgcolor: '#e8f5e8' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {users.filter(u => u.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, bgcolor: '#fff3e0' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {users.filter(u => u.status === 'inactive').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inactive Users
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, bgcolor: '#e3f2fd' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {users.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Users Table */}
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell><strong>User Details</strong></TableCell>
                  <TableCell><strong>Contact</strong></TableCell>
                  <TableCell><strong>Blockchain ID</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Joined</strong></TableCell>
                  <TableCell><strong>Last Active</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 2, color: '#FF9933', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <CreditCard sx={{ mr: 1, fontSize: 16 }} />
                            {user.maskedAadhaar}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Phone sx={{ mr: 1, color: '#138808', fontSize: 18 }} />
                        <Typography variant="body2">
                          +91 {decryptAES(user.phone)}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: '#f0f0f0',
                            padding: '6px 10px',
                            borderRadius: 1,
                            mr: 1,
                            fontSize: '0.85rem'
                          }}
                        >
                          {truncateHash(user.blockchainHash)}
                        </Typography>
                        <Tooltip title="Copy Full Hash">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(user.blockchainHash, 'Blockchain hash')}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={user.status === 'active' ? <CheckCircle /> : <Cancel />}
                        label={user.status.toUpperCase()}
                        color={user.status === 'active' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.signupDate)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.lastLogin)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* No Results */}
          {filteredUsers.length === 0 && (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search criteria' : 'No users have registered yet'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default UserManager;
