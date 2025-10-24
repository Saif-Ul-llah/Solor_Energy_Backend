import Joi from "joi";

export const plantValidation = Joi.object({
  name: Joi.string().min(1).required().messages({
    "string.base": "Plant name must be a string",
    "string.empty": "Plant name must be a string and not empty",
    "any.required": "Plant name is required",
  }),
  capacity: Joi.number().required().messages({
    "number.base": "Capacity must be a number",
    "any.required": "Capacity is required",
  }),
  region: Joi.string().min(1).required().messages({
    "string.base": "Region must be a string",
    "string.empty": "Region must be a string and not empty",
    "any.required": "Region is required",
  }),
  latitude: Joi.number().required().messages({
    "number.base": "Latitude must be a number",
    "any.required": "Latitude is required",
  }),
  longitude: Joi.number().required().messages({
    "number.base": "Longitude must be a number",
    "any.required": "Longitude is required",
  }),
  tariff: Joi.number().required().messages({
    "number.base": "Tariff must be a number",
    "any.required": "Tariff is required",
  }),
  plantType: Joi.string()
    .valid("Grid", "Grid_Meter", "Hybrid")
    .required()
    .messages({
      "string.base": "Plant type must be a string",
      "any.only": "Plant type must be one of [Grid, Grid_Meter, Hybrid]",
      "any.required": "Plant type is required",
    }),
  timeZone: Joi.string().optional().allow(null, "").messages({
    "string.base": "Time zone must be a string",
  }),
  address: Joi.string().min(1).required().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address must be a string and not empty",
    "any.required": "Address is required",
  }),
  currency: Joi.string().min(1).required().messages({
    "string.base": "Currency must be a string",
    "string.empty": "Currency must be a string and not empty",
    "any.required": "Currency is required",
  }),
  installationDate: Joi.date().required().messages({
    "date.base": "Installation date must be a valid date",
    "any.required": "Installation date is required",
  }),
  gridConnectionType: Joi.string().optional().allow(null, "").messages({
    "string.base": "Grid connection type must be a string",
  }),
  gridConnectionDate: Joi.date().optional().allow(null).messages({
    "date.base": "Grid connection date must be a valid date",
  }),
  notes: Joi.string().optional().allow(null, "").messages({
    "string.base": "Notes must be a string",
  }),
  imagesNotes: Joi.string().optional().allow(null, "").messages({
    "string.base": "Images notes must be a string",
  }),
  plantImage: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": "Plant images must be an array of strings (URLs)",
    "string.uri": "Each plant image must be a valid URL",
  }),
  customerId: Joi.string().uuid().required().messages({
    "string.base": "Customer ID must be a string",
    "string.guid": "Customer ID must be a valid UUID",
    "any.required": "Customer ID is required",
  }),
  installerId: Joi.string().uuid().required().messages({
    "string.base": "Installer ID must be a string",
    "string.guid": "Installer ID must be a valid UUID",
    "any.required": "Installer ID is required",
  }),
  plantProfile: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Plant profile must be a string (URL)",
    "string.uri": "Plant profile must be a valid URL",
  }),
  notifyCustomer: Joi.boolean().optional().messages({
    "boolean.base": "Notify customer must be a boolean",
  }),
});

// Update plant validation
export const updatePlantValidation = Joi.object({
  // 🔸 Required Fields
  name: Joi.string().required().messages({
    "string.base": "Name must be a string",
    "any.required": "Name is required",
  }),
  AutoID: Joi.string().required().messages({
    "string.base": "Auto ID must be a string",
    "any.required": "Auto ID is required",
  }),
  plantType: Joi.string()
    .valid("Grid", "Grid_Meter", "Hybrid")
    .required()
    .messages({
      "string.base": "Plant type must be a string",
      "any.only": "Plant type must be one of [Grid, Grid_Meter, Hybrid]",
      "any.required": "Plant type is required",
    }),
  capacity: Joi.number().required().messages({
    "number.base": "Capacity must be a number",
    "any.required": "Capacity is required",
  }),
  tariff: Joi.number().required().messages({
    "number.base": "Tariff must be a number",
    "any.required": "Tariff is required",
  }),
  latitude: Joi.number().required().messages({
    "number.base": "Latitude must be a number",
    "any.required": "Latitude is required",
  }),
  longitude: Joi.number().required().messages({
    "number.base": "Longitude must be a number",
    "any.required": "Longitude is required",
  }),
  currency: Joi.string().min(1).required().messages({
    "string.base": "Currency must be a string",
    "string.empty": "Currency must not be empty",
    "any.required": "Currency is required",
  }),

  // 🔸 Optional Fields
  region: Joi.string().optional().messages({
    "string.base": "Region must be a string",
  }),
  timeZone: Joi.string().optional().messages({
    "string.base": "Time zone must be a string",
  }),
  address: Joi.string().optional().messages({
    "string.base": "Address must be a string",
  }),
  installationDate: Joi.date().optional().messages({
    "date.base": "Installation date must be a valid date",
  }),
  gridConnectionType: Joi.string().optional().messages({
    "string.base": "Grid connection type must be a string",
  }),
  gridConnectionDate: Joi.date().optional().messages({
    "date.base": "Grid connection date must be a valid date",
  }),
  notes: Joi.string().optional().allow("").messages({
    "string.base": "Notes must be a string",
  }),
  imagesNotes: Joi.string().optional().allow("").messages({
    "string.base": "Images notes must be a string",
  }),
  plantProfile: Joi.string().optional().messages({
    "string.base": "Plant profile must be a string",
  }),
  // customerId: Joi.string().guid().optional().messages({
  //   "string.guid": "Customer ID must be a valid UUID",
  // }),
  // installerId: Joi.string().guid().optional().messages({
  //   "string.guid": "Installer ID must be a valid UUID",
  // }),
  plantImage: Joi.array()
    .items(
      Joi.string().uri().messages({
        "string.uri": "Each image URL must be valid",
      })
    )
    .optional()
    .messages({
      "array.base": "Plant image must be an array of image URLs",
    }),
});

// Firmware Upload Validation
export const validateFirmwareUpload = Joi.object({
  name: Joi.string().min(1).required().messages({
    "string.base": "Firmware name must be a string",
    "string.empty": "Firmware name must not be empty",
    "any.required": "Firmware name is required",
  }),
  version: Joi.string().min(1).required().messages({
    "string.base": "Firmware version must be a string",
    "string.empty": "Firmware version must not be empty",
    "any.required": "Firmware version is required",
  }),
  deviceType: Joi.string().min(1).required().messages({
    "string.base": "Device type must be a string",
    "string.empty": "Device type must not be empty",
    "any.required": "Device type is required",  
  }),
  url: Joi.string().uri().required().messages({
    "string.base": "Firmware URL must be a string",
    "string.uri": "Firmware URL must be a valid URI",
    "any.required": "Firmware URL is required",
  }),
  
}); 

