import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useCreateUser } from "./queries";
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";
// import { useHrLocations } from "@/features/settings/work-structure/locations/queries";
import { getAvatarColor } from "@/lib/avatar-utils";
import { IconX } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  employeeId: z.coerce.number().optional().nullable(),
  locationId: z.coerce.number().optional().nullable(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AddUserDialog({ open, onOpenChange, showConfirmation }) {
  const createMutation = useCreateUser();

  // Employee search state
  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  // Location state
  // const [locOpen, setLocOpen] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState(null);
  // const { data: locations = [], isLoading: locLoading } = useHrLocations();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      employeeId: null,
      locationId: null,
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset({
        username: "",
        password: "",
        confirmPassword: "",
        employeeId: null,
        locationId: null,
      });
      setSelectedEmployee(null);
      // setSelectedLocation(null);
      setEmpSearch("");
    }
  }, [open]);

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync({
        USERNAME: data.username,
        PASSWORD: data.password,
        EMPLOYEE_ID: data.employeeId || null,
        LOCATION_ID: data.locationId || null,
        STATUS: "ACTIVE", // Default status
      });
      toast.success("User created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create user.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>Add a new system user account</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Username <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. john.doe"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm Password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

           {/* Employee */}
<FormField
  control={form.control}
  name="employeeId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Employee (Optional)</FormLabel>
      <Popover open={empOpen} onOpenChange={setEmpOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              disabled={isSubmitting}
              className={cn(
                "w-full justify-between font-normal px-2",
                !selectedEmployee && "text-muted-foreground"
              )}
            >
              {selectedEmployee ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage
                      src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedEmployee.id}`}
                    />
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold text-white",
                        getAvatarColor(selectedEmployee.name),
                      )}
                    >
                      {selectedEmployee.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm text-foreground">
                    {selectedEmployee.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({selectedEmployee.empNo})
                  </span>
                </div>
              ) : (
                <span>Search by name or emp no...</span>
              )}
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {selectedEmployee && (
                  <span
                    role="button"
                    className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployee(null);
                      setEmpSearch("");
                      field.onChange(null);
                    }}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </span>
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type 2+ characters..."
              value={empSearch}
              onValueChange={setEmpSearch}
            />
            <CommandList>
              {empFetching && (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
              {!empFetching && empSearch.length >= 2 && employees.length === 0 && (
                <CommandEmpty>No employees found.</CommandEmpty>
              )}
              {!empFetching && empSearch.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
              )}
              <CommandGroup>
                {employees.map((emp) => (
                  <CommandItem
                    key={emp.id}
                    value={String(emp.id)}
                    onSelect={() => {
                      setSelectedEmployee(emp);
                      field.onChange(emp.id);
                      setEmpOpen(false);
                    }}
                  >
                    <Avatar className="h-6 w-6 shrink-0 mr-2">
                      <AvatarImage
                        src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.id}`}
                      />
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-semibold text-white",
                          getAvatarColor(emp.name),
                        )}
                      >
                        {emp.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{emp.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {emp.empNo}
                    </span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        selectedEmployee?.id === emp.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>

            {/* Location */}
            {/* <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <Popover open={locOpen} onOpenChange={setLocOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={isSubmitting}
                          className={cn(
                            "w-full justify-between font-normal",
                            !selectedLocation && "text-muted-foreground"
                          )}
                        >
                          {selectedLocation
                            ? selectedLocation.LOCATION_NAME
                            : "Select location..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search location..." />
                        <CommandList>
                          {locLoading && (
                            <div className="flex items-center justify-center py-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                          {!locLoading && locations.length === 0 && (
                            <CommandEmpty>No locations found.</CommandEmpty>
                          )}
                          <CommandGroup>
                            {locations.map((loc) => (
                              <CommandItem
                                key={loc.ID}
                                value={loc.LOCATION_NAME}
                                onSelect={() => {
                                  setSelectedLocation(loc);
                                  field.onChange(loc.ID);
                                  setLocOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedLocation?.ID === loc.ID
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {loc.LOCATION_NAME}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}