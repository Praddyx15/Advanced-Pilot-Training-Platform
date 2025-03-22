import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, registerSchema, RegisterFormData } from "@/hooks/use-auth";
import { Airplay, Building2, Globe, User, Shield, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Calculate password strength on a scale of 0-4
const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  
  // Character type checks
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return strength;
};

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [organizationType, setOrganizationType] = useState<"ato" | "airline" | "personal" | "admin">("ato");
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "trainee",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    // Remove confirmPassword before submitting to the API
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  // Redirect if user is already logged in
  if (user) {
    navigate("/");
    return null;
  }

  // Maps for organizational icon and labels
  const orgIcons = {
    ato: <Building2 className="h-5 w-5" />,
    airline: <Globe className="h-5 w-5" />,
    personal: <User className="h-5 w-5" />,
    admin: <Shield className="h-5 w-5" />,
  };

  const orgLabels = {
    ato: "ATO",
    airline: "Airline",
    personal: "Personal",
    admin: "Admin",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 text-white font-bold rounded-lg p-2 text-xl mb-2">AP</div>
            <h1 className="text-2xl font-bold text-slate-800">Advanced Pilot Training</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
          </div>
          
          <Tabs
            value={authTab}
            onValueChange={(value) => setAuthTab(value as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign in</CardTitle>
                  <CardDescription>
                    Select your organization type and enter your credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(orgLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`flex flex-col items-center justify-center p-3 rounded-md ${
                            organizationType === key 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                          onClick={() => setOrganizationType(key as any)}
                        >
                          {orgIcons[key as keyof typeof orgIcons]}
                          <span className="mt-1 text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email or Username</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="text" 
                                placeholder="Enter your email or username"
                              />
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
                            <div className="flex items-center justify-between">
                              <FormLabel>Password</FormLabel>
                              <a href="#" className="text-xs text-blue-600 hover:text-blue-800">
                                Forgot password?
                              </a>
                            </div>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label
                          htmlFor="remember"
                          className="text-sm text-slate-600 cursor-pointer"
                        >
                          Remember me
                        </label>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">OR CONTINUE WITH</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
                        <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
                        <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
                        <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.9 0H0.1C0.0447715 0 0 0.0447715 0 0.1V22.9C0 22.9552 0.0447715 23 0.1 23H12.7V14.1H9.6V10.6H12.7V8.075C12.7 5.1035 14.5761 3.4845 17.2775 3.4845C18.5776 3.4845 19.7003 3.5865 20 3.632V6.8H18.2476C16.87 6.8 16.6 7.4495 16.6 8.401V10.6H19.9L19.4 14.1H16.6V23H21.9C21.9552 23 22 22.9552 22 22.9V0.1C22 0.0447715 21.9552 0 21.9 0Z" fill="#1877F2"/>
                      </svg>
                      Microsoft
                    </Button>
                  </div>

                  <p className="mt-6 text-xs text-center text-slate-500">
                    Don't have an account? <a className="text-blue-600 hover:underline" href="#" onClick={(e) => {e.preventDefault(); setAuthTab("register")}}>Contact your administrator</a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Create a new account to access the training platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Organization Type</label>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(orgLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              className={`flex flex-col items-center justify-center p-3 rounded-md ${
                                organizationType === key 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                              onClick={() => setOrganizationType(key as any)}
                            >
                              {orgIcons[key as keyof typeof orgIcons]}
                              <span className="mt-1 text-xs">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                                }}
                              />
                            </FormControl>
                            {field.value && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        passwordStrength <= 2 ? "bg-red-500" :
                                        passwordStrength <= 3 ? "bg-yellow-500" :
                                        "bg-green-500"
                                      }`}
                                      style={{ width: `${Math.min(100, passwordStrength * 25)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">
                                    {passwordStrength <= 2 ? "Weak" :
                                     passwordStrength <= 3 ? "Fair" :
                                     "Strong"}
                                  </span>
                                </div>
                                <ul className="text-xs space-y-1 mt-1 text-slate-600">
                                  <li className={`flex items-center gap-1 ${/[A-Z]/.test(field.value) ? "text-green-600" : ""}`}>
                                    {/[A-Z]/.test(field.value) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    At least one uppercase letter
                                  </li>
                                  <li className={`flex items-center gap-1 ${/[a-z]/.test(field.value) ? "text-green-600" : ""}`}>
                                    {/[a-z]/.test(field.value) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    At least one lowercase letter
                                  </li>
                                  <li className={`flex items-center gap-1 ${/[0-9]/.test(field.value) ? "text-green-600" : ""}`}>
                                    {/[0-9]/.test(field.value) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    At least one number
                                  </li>
                                  <li className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(field.value) ? "text-green-600" : ""}`}>
                                    {/[^A-Za-z0-9]/.test(field.value) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    At least one special character
                                  </li>
                                  <li className={`flex items-center gap-1 ${field.value.length >= 8 ? "text-green-600" : ""}`}>
                                    {field.value.length >= 8 ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    Minimum 8 characters
                                  </li>
                                </ul>
                              </div>
                            )}
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
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                              <label className={`flex items-center space-x-2 p-3 rounded-md border cursor-pointer
                                ${field.value === "trainee" ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                              >
                                <input
                                  type="radio"
                                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                  value="trainee"
                                  checked={field.value === "trainee"}
                                  onChange={() => field.onChange("trainee")}
                                />
                                <div>
                                  <span className="text-sm font-medium">Trainee</span>
                                  <p className="text-xs text-slate-500">Access training modules and assessments</p>
                                </div>
                              </label>
                              <label className={`flex items-center space-x-2 p-3 rounded-md border cursor-pointer
                                ${field.value === "instructor" ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                              >
                                <input
                                  type="radio"
                                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                  value="instructor"
                                  checked={field.value === "instructor"}
                                  onChange={() => field.onChange("instructor")}
                                />
                                <div>
                                  <span className="text-sm font-medium">Instructor</span>
                                  <p className="text-xs text-slate-500">Create and manage training content</p>
                                </div>
                              </label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Registering..." : "Register"}
                      </Button>

                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-slate-500">OR REGISTER WITH</span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full">
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
                            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
                            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
                            <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
                          </svg>
                          Google
                        </Button>
                        <Button variant="outline" className="w-full">
                          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                            <path fill="#00A2ED" d="M1,1 L22,1 L22,22 L1,22 L1,1 Z" />
                            <path fill="#FFFFFF" d="M11.5,9.5 L11.5,6 L9.5,6 L9.5,9.5 L6,9.5 L6,11.5 L9.5,11.5 L9.5,15 L11.5,15 L11.5,11.5 L15,11.5 L15,9.5 L11.5,9.5 Z" />
                          </svg>
                          Microsoft
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="link"
                    onClick={() => setAuthTab("login")}
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800">
        <div className="flex flex-col justify-center items-center h-full p-8 text-white">
          <h1 className="text-3xl font-bold mb-6">Advanced Pilot Training Platform</h1>
          <div className="max-w-lg">
            <p className="mb-8 text-lg">
              A next-generation flight training management system with intelligent scheduling, document processing, 
              compliance tracking, and advanced analytics.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-blue-300 mt-0.5" />
                <div>
                  <h3 className="font-medium">Comprehensive Training Management</h3>
                  <p className="text-sm text-blue-100">Program, module, and syllabus management with regulatory compliance</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-blue-300 mt-0.5" />
                <div>
                  <h3 className="font-medium">Intelligent Scheduling</h3>
                  <p className="text-sm text-blue-100">AI-driven session planning and resource optimization</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-blue-300 mt-0.5" />
                <div>
                  <h3 className="font-medium">Advanced Analytics Dashboard</h3>
                  <p className="text-sm text-blue-100">Real-time performance tracking and predictive insights</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-blue-300 mt-0.5" />
                <div>
                  <h3 className="font-medium">Document Management</h3>
                  <p className="text-sm text-blue-100">AI-powered document processing with regulatory mapping</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
