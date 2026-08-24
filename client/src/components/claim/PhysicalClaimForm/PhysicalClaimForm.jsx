import { useState } from 'react';
import { FormField } from '../../common/FormField/FormField';
import { Button } from '../../common/Button/Button';
import styles from './PhysicalClaimForm.module.css';

export function PhysicalClaimForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pin: '' });

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Full Name" value={form.fullName} onChange={handleChange('fullName')} required />
      <FormField
        label="Phone Number"
        type="tel"
        value={form.phone}
        onChange={handleChange('phone')}
        required
      />
      <FormField label="Address" value={form.address} onChange={handleChange('address')} required />
      <div className={styles.row3}>
        <FormField label="City" value={form.city} onChange={handleChange('city')} required />
        <FormField label="State" value={form.state} onChange={handleChange('state')} required />
        <FormField label="PIN" value={form.pin} onChange={handleChange('pin')} required />
      </div>
      <Button type="submit" isLoading={isSubmitting} loadingText="Submitting...">
        Submit Claim
      </Button>
    </form>
  );
}
