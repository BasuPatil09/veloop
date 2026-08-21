import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout/AuthLayout';
import { FormField } from '../../components/common/FormField/FormField';
import { Button } from '../../components/common/Button/Button';
import { Alert } from '../../components/common/Alert/Alert';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errorMessages';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't log you in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to view your entries and join active giveaways."
      footer={
        <>
          New to VELOOP Rewards? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error">{error}</Alert>}

        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange('email')}
          required
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange('password')}
          required
        />

        <Button type="submit" isLoading={isSubmitting} loadingText="Logging in..." onClick={handleSubmit}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
