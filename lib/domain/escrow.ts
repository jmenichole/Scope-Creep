export type EscrowAction = 'lock' | 'unlock' | 'release';

export function applyEscrow(
  current: { paymentLocked: boolean; paymentReleased: boolean },
  action: EscrowAction,
): { paymentLocked: boolean; paymentReleased: boolean } {
  switch (action) {
    case 'lock':
      return { ...current, paymentLocked: true };
    case 'unlock':
      return { ...current, paymentLocked: false };
    case 'release':
      if (current.paymentLocked) throw new Error('Cannot release locked payment');
      return { ...current, paymentReleased: true };
  }
}
