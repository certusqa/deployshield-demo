export const users = {
  standard: {
    username: 'standard_user',
    password: 'secret_sauce',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
} as const;

export const checkout = {
  firstName: 'Deploy',
  lastName: 'Shield',
  postalCode: '94105',
} as const;
