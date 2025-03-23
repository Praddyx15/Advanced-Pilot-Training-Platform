import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation, Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema extending the insertUserSchema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "trainee", // Default role, will be determined by email
      organizationType: "Personal", // Default org type, will be determined by email
      organizationName: "", // Added organization name field
    },
  });

  // Submit login form
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Function to determine role and organization type based on email pattern
  const determineRoleFromEmail = (email: string): { role: string; organizationType: string } => {
    const lowerEmail = email.toLowerCase();
    
    if (lowerEmail.includes('admin@')) {
      return { role: 'admin', organizationType: 'Admin' };
    } else if (lowerEmail.includes('examiner@ato')) {
      return { role: 'examiner', organizationType: 'ATO' };
    } else if (lowerEmail.includes('ato@')) {
      return { role: 'instructor', organizationType: 'ATO' };
    } else if (lowerEmail.includes('airline@')) {
      return { role: 'instructor', organizationType: 'Airline' };
    } else if (lowerEmail.includes('student@ato')) {
      return { role: 'trainee', organizationType: 'ATO' };
    } else if (lowerEmail.includes('student@')) {
      return { role: 'trainee', organizationType: 'Airline' };
    } else {
      // Default
      return { role: 'trainee', organizationType: 'Personal' };
    }
  };

  // Submit registration form
  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword as it's not part of the API schema
    const { confirmPassword, ...registerData } = values;
    
    // Set role and organization type based on email pattern
    const { role, organizationType } = determineRoleFromEmail(values.email);
    registerData.role = role;
    registerData.organizationType = organizationType;
    
    registerMutation.mutate(registerData);
  };

  // If user is logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Form Column */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-6 md:p-12">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/images/logo.png" 
                alt="60 Minutes Aviation Logo" 
                className="h-20"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Welcome to Advanced Pilot Training Platform
            </h1>
            <p className="text-gray-500 md:text-xl/relaxed dark:text-gray-400">
              Sign in to your account or create a new one
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="******" 
                                  {...field} 
                                />
                                <button 
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                  {showLoginPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-sm p-2 mb-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <p className="font-medium text-gray-800 dark:text-gray-200">Pre-configured Test Accounts:</p>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Admin:</p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                              <li><strong>Username:</strong> admin | <strong>Password:</strong> Admin@123</li>
                            </ul>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">ATO Users:</p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                              <li><strong>Instructor:</strong> ato_airline | <strong>Password:</strong> ATO@airline123</li>
                              <li><strong>Examiner:</strong> examiner | <strong>Password:</strong> Examiner@123</li>
                              <li><strong>Student:</strong> atostudent | <strong>Password:</strong> Student@123</li>
                            </ul>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Airline Users:</p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                              <li><strong>Instructor:</strong> airline | <strong>Password:</strong> Airline@123</li>
                              <li><strong>Student:</strong> student | <strong>Password:</strong> Student@123</li>
                              <li><strong>Student (alt):</strong> student2 | <strong>Password:</strong> Student@123</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Create a new account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showRegisterPassword ? "text" : "password"} 
                                    placeholder="******" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  >
                                    {showRegisterPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="******" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <FormMessage className="text-center">
                          <div className="text-sm p-2 mb-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <p className="font-medium text-gray-800 dark:text-gray-200">Pre-configured Test Accounts:</p>
                            
                            <div className="space-y-2 mt-1">
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Admin:</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                                  <li><strong>Username:</strong> admin | <strong>Password:</strong> Admin@123</li>
                                </ul>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">ATO Users:</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                                  <li><strong>Instructor:</strong> ato_airline | <strong>Password:</strong> ATO@airline123</li>
                                  <li><strong>Examiner:</strong> examiner | <strong>Password:</strong> Examiner@123</li>
                                  <li><strong>Student:</strong> atostudent | <strong>Password:</strong> Student@123</li>
                                </ul>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Airline Users:</p>
                                <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                                  <li><strong>Instructor:</strong> airline | <strong>Password:</strong> Airline@123</li>
                                  <li><strong>Student:</strong> student | <strong>Password:</strong> Student@123</li>
                                  <li><strong>Student (alt):</strong> student2 | <strong>Password:</strong> Student@123</li>
                                </ul>
                              </div>
                            </div>
                            
                            <p className="font-medium text-gray-800 dark:text-gray-200 mt-3">User Role Based on Email:</p>
                            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside">
                              <li><strong>admin@example.com</strong> - Administrator access</li>
                              <li><strong>examiner@ato.com</strong> - ATO Examiner access</li>
                              <li><strong>ato@example.com</strong> - ATO Instructor access</li>
                              <li><strong>airline@example.com</strong> - Airline Instructor access</li>
                              <li><strong>student@ato.com</strong> - ATO Student access</li>
                              <li><strong>student@example.com</strong> - Airline Student access</li>
                            </ul>
                          </div>
                        </FormMessage>
                        
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                  <SelectItem value="instructor">ATO/Airline Instructor</SelectItem>
                                  <SelectItem value="trainee">Student/Trainee</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your role in the system. The application features will adapt based on your role.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="organizationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select organization type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Airline">Airline</SelectItem>
                                  <SelectItem value="ATO">ATO (Approved Training Organization)</SelectItem>
                                  <SelectItem value="Personal">Personal</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="organizationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Organization name" value={field.value || ''} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col justify-center items-center p-12 space-y-8 text-center w-full">
          <div className="mb-6">
            <img 
              src="/images/logo.png" 
              alt="60 Minutes Aviation Logo" 
              className="h-24" 
            />
          </div>
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Advanced Pilot Training Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-300 md:text-xl/relaxed">
              The next generation training platform for aviation professionals
            </p>
          </div>
          <div className="space-y-4 text-left max-w-md">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Comprehensive Training Management</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage training programs, sessions, and assessments in one platform
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Syllabus Generation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create training syllabi from regulatory documents and industry best practices
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Regulatory Compliance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stay compliant with aviation authorities and track requirements
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Advanced Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gain insights into trainee performance and training effectiveness
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}