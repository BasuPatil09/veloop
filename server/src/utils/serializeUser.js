function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    // Flat columns on the model (better for atomic increment/decrement in the join
    // flow) are reshaped back into the nested object the frontend already expects.
    balances: {
      ve: user.balanceVe,
      sve: user.balanceSve,
      token: user.balanceToken,
    },
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

module.exports = { serializeUser };
