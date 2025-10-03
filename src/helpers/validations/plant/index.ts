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
});

// id        String   @id @default(uuid())
// createdAt DateTime @default(now())

// customerId String @unique
// customer   User   @relation("customer", fields: [customerId], references: [id], onDelete: Cascade)

// installerId String @unique
// installer   User   @relation("installer", fields: [installerId], references: [id], onDelete: Cascade)

// name       String
// plantType  PlantType
// capacity   Int
// region     String
// locationId Int?      @unique
// location   Location? @relation(fields: [locationId], references: [id], onDelete: Cascade)
// tariff     Float
