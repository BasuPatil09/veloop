import { useState } from 'react';
import { FormField } from '../../common/FormField/FormField';
import { Button } from '../../common/Button/Button';

export function GiftCardClaimForm({ onSubmit, isSubmitting }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        label="Email Address"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        hint="Enter the email where you want to receive your gift card."
        required
      />
      <Button type="submit" isLoading={isSubmitting} loadingText="Submitting...">
        Submit Claim
      </Button>
    </form>
  );
}
