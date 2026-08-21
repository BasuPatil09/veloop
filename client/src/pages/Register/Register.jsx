import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout/AuthLayout';
import { FormField } from '../../components/common/FormField/FormField';
import { Button } from '../../components/common/Button/Button';
import { Alert } from '../../components/common/Alert/Alert';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errorMessages';

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/\d/.test(form.password)) errors.password = 'Password must contain at least one number.';
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, "We couldn't create your account. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join VELOOP Rewards to start earning entries and joining giveaways."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}

        <FormField
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          required
        />
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange('email')}
          error={fieldErrors.email}
          required
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange('password')}
          error={fieldErrors.password}
          hint="At least 8 characters, including a number."
          required
        />

        <Button type="submit" isLoading={isSubmitting} loadingText="Creating account..." onClick={handleSubmit}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
