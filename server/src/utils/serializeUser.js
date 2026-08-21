function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    balances: user.balances,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

module.exports = { serializeUser };
