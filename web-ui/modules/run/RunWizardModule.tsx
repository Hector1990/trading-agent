'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  FormControl,
  FormHelperText,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
} from '@mui/material';
import { Info, TrendingUp, Settings, RocketLaunch } from '@mui/icons-material';
import { Button, Card } from '@/components/primitives';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingAgentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

const api = new TradingAgentsAPI();

// Validation schema
const RunConfigSchema = z.object({
  ticker: z.string().min(1, 'Stock ticker is required').toUpperCase(),
  date: z.string().min(1, 'Date is required'),
  analysts: z.array(z.enum(['market', 'social', 'news', 'fundamentals'])).min(1, 'Select at least one analyst'),
  llmProvider: z.enum(['openai', 'anthropic', 'deepseek', 'ollama']),
  deepThinker: z.string().min(1, 'Deep thinker model is required'),
  backendUrl: z.string().url('Invalid URL format'),
  apiKey: z.string().optional(),
  resultsDir: z.string().optional(),
  debug: z.boolean().optional(),
});

type RunConfigForm = z.infer<typeof RunConfigSchema>;

const analystOptions = [
  { value: 'market', label: 'Market Analysis', description: 'Technical indicators and price action' },
  { value: 'social', label: 'Social Sentiment', description: 'Social media and community sentiment' },
  { value: 'news', label: 'News Analysis', description: 'Latest news and events impact' },
  { value: 'fundamentals', label: 'Fundamentals', description: 'Company financials and metrics' },
];

const llmProviders = [
  { value: 'deepseek', label: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { value: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1' },
  { value: 'anthropic', label: 'Anthropic', url: 'https://api.anthropic.com/v1' },
  { value: 'ollama', label: 'Ollama (Local)', url: 'http://localhost:11434' },
];

export function RunWizardModule() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<RunConfigForm>({
    resolver: zodResolver(RunConfigSchema),
    mode: 'onChange',
    defaultValues: {
      ticker: 'SPY',
      date: format(new Date(), 'yyyy-MM-dd'),
      analysts: ['market'],
      llmProvider: 'deepseek',
      deepThinker: 'deepseek-reasoner',
      backendUrl: 'https://api.deepseek.com/v1',
      resultsDir: 'results',
      debug: false,
    },
  });

  const selectedProvider = watch('llmProvider');

  const handleProviderChange = (provider: string) => {
    const providerConfig = llmProviders.find(p => p.value === provider);
    if (providerConfig) {
      setValue('backendUrl', providerConfig.url);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: RunConfigForm) => {
    setIsRunning(true);
    try {
      const result = await api.startRun(data as any);
      toast.success('Analysis started successfully');
      router.push(`/run/${result.id}`);
    } catch (error: any) {
      toast.error('Failed to start analysis: ' + (error.message || 'Unknown error'));
      setIsRunning(false);
    }
  };

  const steps = [
    {
      label: 'Basic Configuration',
      icon: <TrendingUp />,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Controller
            name="ticker"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Stock Ticker"
                placeholder="SPY"
                fullWidth
                error={!!errors.ticker}
                helperText={errors.ticker?.message || 'Enter the stock symbol to analyze'}
                InputProps={{
                  sx: { textTransform: 'uppercase' },
                }}
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Analysis Date"
                type="date"
                fullWidth
                error={!!errors.date}
                helperText={errors.date?.message || 'Select the date for analysis'}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          />

          <FormControl error={!!errors.analysts}>
            <FormLabel component="legend">Select Analysts</FormLabel>
            <Controller
              name="analysts"
              control={control}
              render={({ field }) => (
                <FormGroup>
                  {analystOptions.map((analyst) => (
                    <FormControlLabel
                      key={analyst.value}
                      control={
                        <Checkbox
                          checked={field.value.includes(analyst.value as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, analyst.value]);
                            } else {
                              field.onChange(field.value.filter(v => v !== analyst.value));
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {analyst.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {analyst.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              )}
            />
            {errors.analysts && (
              <FormHelperText>{errors.analysts.message}</FormHelperText>
            )}
          </FormControl>
        </Box>
      ),
    },
    {
      label: 'AI Configuration',
      icon: <Settings />,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Controller
            name="llmProvider"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="LLM Provider"
                fullWidth
                error={!!errors.llmProvider}
                helperText={errors.llmProvider?.message || 'Select the AI provider'}
                onChange={(e) => {
                  field.onChange(e);
                  handleProviderChange(e.target.value);
                }}
              >
                {llmProviders.map((provider) => (
                  <MenuItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="deepThinker"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Deep Thinker Model"
                placeholder="deepseek-reasoner"
                fullWidth
                error={!!errors.deepThinker}
                helperText={errors.deepThinker?.message || 'Specify the model for deep analysis'}
              />
            )}
          />

          <Controller
            name="backendUrl"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="API Endpoint"
                type="url"
                fullWidth
                error={!!errors.backendUrl}
                helperText={errors.backendUrl?.message || 'API endpoint URL'}
              />
            )}
          />

          <Controller
            name="apiKey"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="API Key (Optional)"
                type="password"
                fullWidth
                placeholder="sk-..."
                helperText="Your API key for authentication"
              />
            )}
          />

          <Controller
            name="debug"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                  />
                }
                label="Enable debug mode"
              />
            )}
          />
        </Box>
      ),
    },
    {
      label: 'Review & Launch',
      icon: <RocketLaunch />,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info">
            <AlertTitle>Ready to Launch</AlertTitle>
            Review your configuration before starting the analysis.
          </Alert>

          <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Configuration Summary
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Ticker:</Typography>
                <Typography variant="body2" fontWeight={600}>{watch('ticker')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Date:</Typography>
                <Typography variant="body2" fontWeight={600}>{watch('date')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Analysts:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {watch('analysts').join(', ')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Provider:</Typography>
                <Typography variant="body2" fontWeight={600}>{watch('llmProvider')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Model:</Typography>
                <Typography variant="body2" fontWeight={600}>{watch('deepThinker')}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Run Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure and launch a new trading analysis task
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Quick Start</AlertTitle>
        Ensure you have configured your API keys in settings. The analysis will use multiple AI analysts to provide comprehensive insights.
      </Alert>

      <Card>
        <Box sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: activeStep >= index ? 'primary.main' : 'action.disabledBackground',
                        color: 'white',
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  <Typography variant="h6">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{ py: 2 }}>
                        {step.content}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        <Button
                          variant="text"
                          onClick={handleBack}
                          disabled={index === 0}
                        >
                          Back
                        </Button>
                        {index < steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                          >
                            Continue
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleSubmit(onSubmit)}
                            loading={isRunning}
                            disabled={!isValid}
                          >
                            Launch Analysis
                          </Button>
                        )}
                      </Box>
                    </motion.div>
                  </AnimatePresence>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Card>
    </Box>
  );
}
