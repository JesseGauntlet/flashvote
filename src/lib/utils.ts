import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse CSV string into array of objects
export function parseCSV(csv: string, requiredFields: string[] = []): { data: Record<string, string>[], errors: string[] } {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return {
      data: [],
      errors: ['CSV file is empty']
    };
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => {
    // Remove quotes if present
    const cleanHeader = header.trim().replace(/^["']|["']$/g, '');
    return cleanHeader;
  });
  
  // Verify required fields
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  if (missingFields.length > 0) {
    return {
      data: [],
      errors: [`Missing required fields: ${missingFields.join(', ')}`]
    };
  }
  
  const results: Record<string, string>[] = [];
  const errors: string[] = [];
  
  // Start from index 1 to skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    
    // Handle quoted values with commas inside them
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
    
    // Check if we have the right number of values
    if (values.length !== headers.length) {
      errors.push(`Line ${i + 1}: Expected ${headers.length} values but got ${values.length}`);
      continue;
    }
    
    // Create object from headers and values
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j];
    }
    
    results.push(obj);
  }
  
  return {
    data: results,
    errors
  };
}
