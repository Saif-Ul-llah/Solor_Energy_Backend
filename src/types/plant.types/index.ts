export interface PlantInterface {
  name: string;                     
  capacity: number;                 
  region: string;                   
  latitude: number;                 
  longitude: number;                
  tariff: number;                   
  plantType: "Grid" | "Grid_Meter" | "Hybrid";
  timeZone?: string | null;          
  address: string;                   
  currency?: string;                 
  installationDate?: string;         
  gridConnectionType?: string | null;
  gridConnectionDate?: string | null;
  notes?: string | null;             
  imagesNotes?: string | null;       
  plantImage?: string[];             
  customerId: string;                
  installerId: string;               
}
