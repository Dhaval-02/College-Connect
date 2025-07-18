import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { popularColleges, searchColleges } from "@/lib/colleges";

interface CollegeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CollegeSelector({ value, onValueChange, placeholder = "Select college..." }: CollegeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCollege, setCustomCollege] = useState("");
  const [filteredColleges, setFilteredColleges] = useState(popularColleges);

  useEffect(() => {
    const filtered = searchColleges(searchTerm);
    setFilteredColleges(filtered);
  }, [searchTerm]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onValueChange("");
    } else {
      onValueChange(selectedValue);
    }
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomCollegeAdd = () => {
    if (customCollege.trim()) {
      onValueChange(customCollege.trim());
      setCustomCollege("");
      setShowCustomInput(false);
      setOpen(false);
    }
  };

  const displayValue = value || placeholder;

  return (
    <div className="space-y-2">
      <Label htmlFor="college">College/University</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {displayValue}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search colleges..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 p-2">
                  <p className="text-sm text-muted-foreground">
                    No colleges found. Add your college:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom College
                  </Button>
                </div>
              </CommandEmpty>
              
              {!showCustomInput && (
                <>
                  <CommandGroup heading="Popular Colleges">
                    {popularColleges.slice(0, 5).map((college) => (
                      <CommandItem
                        key={college}
                        value={college}
                        onSelect={() => handleSelect(college)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === college ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {college}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  
                  <CommandGroup heading="All Colleges">
                    {filteredColleges.filter(college => !popularColleges.slice(0, 5).includes(college)).slice(0, 20).map((college) => (
                      <CommandItem
                        key={college}
                        value={college}
                        onSelect={() => handleSelect(college)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === college ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {college}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setShowCustomInput(true)}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Custom College
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
              
              {showCustomInput && (
                <div className="p-3 space-y-2">
                  <Label htmlFor="custom-college">College Name</Label>
                  <Input
                    id="custom-college"
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    placeholder="Enter your college name"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCustomCollegeAdd();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCustomCollegeAdd}
                      disabled={!customCollege.trim()}
                    >
                      Add College
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomCollege("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}