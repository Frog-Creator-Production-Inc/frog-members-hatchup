# User Onboarding

The onboarding process is a critical part of the Frog Members platform, collecting essential information from new users to personalize their experience and provide relevant recommendations.

## Onboarding Flow

The onboarding process consists of multiple steps that guide users through profile creation:

1. **Welcome**: Introduction to the platform and onboarding process
2. **Personal Information**: Basic user details (name, contact information)
3. **Educational Background**: Previous education and qualifications
4. **Study Goals**: Desired fields of study and career objectives
5. **Migration Goals**: Reasons for studying abroad and target countries
6. **Preferences**: Course type, duration, and budget preferences
7. **Completion**: Confirmation and redirection to dashboard

## Technical Implementation

### Onboarding Page

The onboarding process is implemented in `app/onboarding/page.tsx` as a multi-step form with state management:

- Uses React's `useState` to track current step and form data
- Implements form validation at each step
- Stores progress in local storage to prevent data loss
- Submits completed profile to Supabase database

### Middleware Protection

The middleware (`middleware.ts`) enforces onboarding completion:

- Checks if user has a profile record with `onboarding_completed: true`
- Redirects unauthenticated users to login
- Redirects authenticated users without completed onboarding to the onboarding page
- Prevents users from accessing the onboarding page if already completed

### Database Schema

The onboarding data is stored in the `profiles` table with fields including:

- Basic information (name, email, phone)
- Educational background
- Study preferences
- Migration goals
- Onboarding completion status

## Key Components

### OnboardingForm

The main form component that manages the multi-step process:

```typescript
// Simplified example
const OnboardingForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({...});
  
  const handleNext = () => {
    // Validate current step
    // Save progress to localStorage
    setStep(step + 1);
  };
  
  const handleSubmit = async () => {
    // Submit data to Supabase
    // Update onboarding_completed status
    // Redirect to dashboard
  };
  
  return (
    <div>
      {/* Step indicators */}
      {step === 1 && <Step1Form data={formData} onChange={handleChange} />}
      {step === 2 && <Step2Form data={formData} onChange={handleChange} />}
      {/* Additional steps */}
      <NavigationButtons onNext={handleNext} onBack={handleBack} />
    </div>
  );
};
```

### ProfileService

Server actions for profile management:

```typescript
// In app/actions.ts
export async function createProfile(profileData) {
  const supabase = createServerActionClient();
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) throw new Error("User not authenticated");
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...profileData,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    });
    
  if (error) throw error;
  return data;
}
```

## User Experience Considerations

- **Progress Indication**: Clear visual indicators of current step and overall progress
- **Save & Continue Later**: Ability to save progress and return later
- **Validation Feedback**: Immediate feedback on form errors
- **Adaptive Questions**: Questions may change based on previous answers
- **Minimalist Design**: Simple, focused interface to reduce cognitive load

## Integration Points

The onboarding process integrates with several other system components:

- **Authentication System**: Verifies user identity
- **Profile Database**: Stores user information
- **Recommendation Engine**: Uses profile data to suggest courses
- **Dashboard**: Displays personalized content based on profile
- **Slack Notifications**: Alerts administrators about new user registrations

## Next Steps

For more information about related features:
- [User Dashboard](./dashboard.md)
- [Authentication Flow](../technical/authentication.md)
- [Database Schema](../technical/database.md)
