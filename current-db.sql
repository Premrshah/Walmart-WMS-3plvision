-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.walmart_sellers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_name character varying NOT NULL,
  ste_code character varying,
  contact_name character varying NOT NULL,
  email character varying NOT NULL,
  primary_phone character varying NOT NULL,
  seller_logo text,
  business_name character varying NOT NULL,
  address text NOT NULL,
  city character varying NOT NULL,
  state character varying NOT NULL,
  zipcode character varying NOT NULL,
  country character varying NOT NULL,
  store_type character varying NOT NULL,
  comments text,
  walmart_address text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT walmart_sellers_pkey PRIMARY KEY (id)
);