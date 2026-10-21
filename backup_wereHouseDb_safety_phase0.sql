--
-- PostgreSQL database dump
--

\restrict ypcEp8pL10aPZT23GcfO2jpn3ALrJdP87e5pCgfThw6rzgjaEcblhdM2qoPufaE

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_code text NOT NULL,
    name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    territory text,
    address text,
    assigned_port_code text,
    status text DEFAULT 'Active'::text NOT NULL,
    rating text DEFAULT '5.0/5'::text,
    credit_limit_usd numeric(12,2) DEFAULT 0.00,
    current_balance_usd numeric(12,2) DEFAULT 0.00,
    last_activity text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    log_number text NOT NULL,
    "timestamp" text NOT NULL,
    user_id uuid,
    user_name text NOT NULL,
    user_role text,
    module text NOT NULL,
    action text NOT NULL,
    record_id text,
    description text NOT NULL,
    ip_address text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bills_of_lading; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills_of_lading (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bl_number text NOT NULL,
    type text DEFAULT 'Master Ocean Bill of Lading'::text NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    shipment_id text,
    shipment_number text,
    consolidation_id uuid,
    house_bill_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_date text NOT NULL,
    issue_date text,
    shipper jsonb NOT NULL,
    consignee jsonb NOT NULL,
    notify_party jsonb,
    agent_id uuid,
    agent_name text,
    pre_carriage_by text,
    place_of_receipt text,
    ocean_vessel text,
    voyage_number text,
    carrier text,
    port_of_loading text NOT NULL,
    port_of_discharge text NOT NULL,
    place_of_delivery text,
    container_number text,
    seal_number text,
    container_type text,
    marks_and_numbers text,
    cargo_description text,
    package_count integer DEFAULT 0 NOT NULL,
    total_pieces integer DEFAULT 0 NOT NULL,
    package_type text,
    gross_weight_lbs numeric(10,2) DEFAULT 0.00,
    gross_weight_kg numeric(10,2) DEFAULT 0.00,
    cbm numeric(10,2) DEFAULT 0.00,
    cft numeric(10,2) DEFAULT 0.00,
    freight_payable_at text DEFAULT 'Miami, FL'::text,
    freight_terms text DEFAULT 'Freight Prepaid'::text NOT NULL,
    number_of_originals text DEFAULT '3 (THREE)'::text NOT NULL,
    hold_details jsonb DEFAULT '{"isOnHold": false}'::jsonb NOT NULL,
    charges jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_freight_usd numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bills_of_lading OWNER TO postgres;

--
-- Name: cargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cargo_number text NOT NULL,
    warehouse_receipt_id uuid NOT NULL,
    receipt_number text NOT NULL,
    customer text NOT NULL,
    description text NOT NULL,
    package_count integer DEFAULT 1 NOT NULL,
    total_pieces integer DEFAULT 1 NOT NULL,
    package_type text,
    length_inches numeric(10,2),
    width_inches numeric(10,2),
    height_inches numeric(10,2),
    weight_lbs numeric(10,2),
    weight_kg numeric(10,2),
    cft numeric(10,2),
    cbm numeric(10,2),
    warehouse_location text DEFAULT 'CFS Miami'::text,
    destination_port text,
    destination_code text,
    status text DEFAULT 'Ready for Consolidation'::text NOT NULL,
    barcode text,
    qr_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agent_id uuid,
    agent_name text
);


ALTER TABLE public.cargo OWNER TO postgres;

--
-- Name: consolidations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consolidations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consolidation_number text NOT NULL,
    title text NOT NULL,
    destination_port text NOT NULL,
    destination_code text NOT NULL,
    created_date text NOT NULL,
    status text DEFAULT 'Planning'::text NOT NULL,
    container_id uuid,
    container_number text,
    container_type text,
    container_capacity_cbm numeric(10,2),
    seal_number text,
    vessel_id uuid,
    vessel_name text,
    voyage_id uuid,
    voyage_number text,
    carrier text,
    loading_port text DEFAULT 'Port of Miami (USMIA)'::text NOT NULL,
    discharge_port text NOT NULL,
    total_house_bills integer DEFAULT 0 NOT NULL,
    house_bill_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_receipts integer DEFAULT 0 NOT NULL,
    receipt_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_packages integer DEFAULT 0 NOT NULL,
    total_pieces integer DEFAULT 0 NOT NULL,
    total_weight_lbs numeric(10,2) DEFAULT 0.00,
    total_weight_kg numeric(10,2) DEFAULT 0.00,
    total_cft numeric(10,2) DEFAULT 0.00,
    total_cbm numeric(10,2) DEFAULT 0.00,
    container_fill_percentage numeric(5,2) DEFAULT 0.00,
    assigned_shipment_id text,
    assigned_master_bl_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agent_id text,
    agent_name text
);


ALTER TABLE public.consolidations OWNER TO postgres;

--
-- Name: containers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.containers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    container_number text NOT NULL,
    type text NOT NULL,
    carrier text,
    seal_number text,
    tare_weight_kg numeric(10,2),
    max_payload_kg numeric(10,2),
    max_volume_cbm numeric(10,2),
    loaded_weight_kg numeric(10,2) DEFAULT 0.00,
    loaded_volume_cbm numeric(10,2) DEFAULT 0.00,
    fill_percentage numeric(5,2) DEFAULT 0.00,
    current_shipment_id text,
    current_shipment_number text,
    status text DEFAULT 'Available at CFS Yard'::text NOT NULL,
    location text,
    origin_port text,
    discharge_port text,
    temperature_controlled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.containers OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_number text NOT NULL,
    name text NOT NULL,
    company_name text NOT NULL,
    contact_person text,
    email text,
    telephone text,
    phone text,
    address text,
    destination_port text,
    destination_code text,
    tax_id text,
    account_type text,
    credit_terms text,
    notes text,
    status text DEFAULT 'Active'::text NOT NULL,
    created_date text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_number text,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text,
    mime_type text,
    file_size integer,
    status text DEFAULT 'Generated'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: house_bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.house_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hbl_number text NOT NULL,
    customer_id uuid,
    customer_name text NOT NULL,
    shipper jsonb NOT NULL,
    consignee jsonb NOT NULL,
    notify_party jsonb,
    agent_id uuid,
    agent_name text,
    origin_port text DEFAULT 'Port of Miami (USMIA), FL'::text NOT NULL,
    destination_port text NOT NULL,
    destination_code text NOT NULL,
    warehouse_receipt_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    cargo_description text,
    packages jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_packages integer DEFAULT 0 NOT NULL,
    total_pieces integer DEFAULT 0 NOT NULL,
    total_weight_lbs numeric(10,2) DEFAULT 0.00,
    total_weight_kg numeric(10,2) DEFAULT 0.00,
    total_cft numeric(10,2) DEFAULT 0.00,
    total_cbm numeric(10,2) DEFAULT 0.00,
    status text DEFAULT 'Active'::text NOT NULL,
    freight_terms text DEFAULT 'Freight Prepaid'::text NOT NULL,
    created_date text NOT NULL,
    issue_date text,
    assigned_consolidation_id text,
    assigned_master_bl_id text,
    assigned_shipment_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.house_bills OWNER TO postgres;

--
-- Name: manifests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manifests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    manifest_number text NOT NULL,
    type text DEFAULT 'Ocean Cargo Inward / Outward Manifest'::text NOT NULL,
    title text NOT NULL,
    vessel_name text NOT NULL,
    voyage_number text NOT NULL,
    flag text,
    master_name text,
    port_of_loading text NOT NULL,
    port_of_discharge text NOT NULL,
    departure_date text,
    arrival_date text,
    carrier text,
    total_bls integer DEFAULT 1 NOT NULL,
    total_house_bills integer DEFAULT 0 NOT NULL,
    total_containers integer DEFAULT 1 NOT NULL,
    total_packages integer DEFAULT 0 NOT NULL,
    total_pieces integer DEFAULT 0 NOT NULL,
    total_weight_lbs numeric(10,2) DEFAULT 0.00,
    total_weight_kg numeric(10,2) DEFAULT 0.00,
    total_cbm numeric(10,2) DEFAULT 0.00,
    total_cft numeric(10,2) DEFAULT 0.00,
    status text DEFAULT 'Generated'::text NOT NULL,
    master_bl_number text,
    line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.manifests OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    module text NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    extra_actions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: ports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    port_code text NOT NULL,
    name text NOT NULL,
    island text,
    country text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    default_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ports OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_key text NOT NULL,
    role_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shipment_number text NOT NULL,
    type text DEFAULT 'Ocean LCL Consolidation'::text NOT NULL,
    service_mode text DEFAULT 'Port-to-Port'::text NOT NULL,
    status text DEFAULT 'Cargo Received'::text NOT NULL,
    tracking_number text NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    destination_port text NOT NULL,
    destination_code text NOT NULL,
    agent_id uuid,
    agent_name text,
    vessel_name text,
    voyage_number text,
    carrier text,
    container_number text,
    container_type text,
    seal_number text,
    bill_of_lading_id text,
    bill_of_lading_number text,
    bl_status text,
    manifest_number text,
    total_packages integer DEFAULT 0 NOT NULL,
    total_weight_lbs numeric(10,2) DEFAULT 0.00,
    total_weight_kg numeric(10,2) DEFAULT 0.00,
    total_cft numeric(10,2) DEFAULT 0.00,
    total_cbm numeric(10,2) DEFAULT 0.00,
    etd text,
    eta text,
    created_date text NOT NULL,
    warehouse_receipt_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    consolidation_id text,
    current_location text,
    tracking_checkpoints jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipments OWNER TO postgres;

--
-- Name: tracking_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tracking_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracking_number text NOT NULL,
    shipment_id uuid,
    stage text NOT NULL,
    status text DEFAULT 'Completed'::text NOT NULL,
    event_date text NOT NULL,
    event_time text,
    location text NOT NULL,
    notes text,
    checkpoint_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tracking_events OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_code text,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role_key text NOT NULL,
    department text,
    status text DEFAULT 'Active'::text NOT NULL,
    avatar text,
    last_login text,
    phone text,
    agent_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vessels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vessels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    imo_number text NOT NULL,
    flag text,
    type text,
    carrier text,
    capacity_teu integer,
    deadweight_tonnage integer,
    built_year integer,
    status text DEFAULT 'Scheduled'::text NOT NULL,
    current_voyage text,
    active_route text,
    eta_next_port text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vessels OWNER TO postgres;

--
-- Name: voyages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voyages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voyage_number text NOT NULL,
    vessel_id uuid,
    vessel_name text NOT NULL,
    carrier text,
    origin_port text NOT NULL,
    destination_port text NOT NULL,
    departure_date text,
    arrival_date text,
    status text DEFAULT 'Scheduled'::text NOT NULL,
    assigned_shipments_count integer DEFAULT 0 NOT NULL,
    total_teu_utilized numeric(6,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.voyages OWNER TO postgres;

--
-- Name: warehouse_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    receipt_number text NOT NULL,
    sequence_number integer NOT NULL,
    date text NOT NULL,
    "time" text,
    customer_id uuid,
    customer_name text NOT NULL,
    shipper text,
    consignee text,
    agent_id uuid,
    agent_name text,
    destination_port text NOT NULL,
    destination_code text NOT NULL,
    cargo_description text,
    package_count integer DEFAULT 1 NOT NULL,
    total_pieces integer DEFAULT 1 NOT NULL,
    package_type text,
    packages jsonb DEFAULT '[]'::jsonb NOT NULL,
    length_inches numeric(10,2),
    width_inches numeric(10,2),
    height_inches numeric(10,2),
    weight_lbs numeric(10,2),
    weight_kg numeric(10,2),
    total_cft numeric(10,2),
    total_cbm numeric(10,2),
    warehouse_location text DEFAULT 'CFS Miami'::text,
    status text DEFAULT 'Ready for Consolidation'::text NOT NULL,
    hazardous boolean DEFAULT false NOT NULL,
    fragile boolean DEFAULT false NOT NULL,
    notes text,
    barcode text,
    qr_code text,
    assigned_house_bill_id text,
    assigned_consolidation_id text,
    assigned_shipment_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse_receipts OWNER TO postgres;

--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, agent_code, name, contact_person, email, phone, territory, address, assigned_port_code, status, rating, credit_limit_usd, current_balance_usd, last_activity, created_at, updated_at) FROM stdin;
833f25c0-703c-47cd-a767-3910720e0cd3	AGT-001	Caribbean Express Freight Ltd.	David Cartwright	operations@caribbeanexpressbahamas.com	+1 (242) 555-9000	Nassau & Freeport (Bahamas)	Arawak Cay Port Terminal, Nassau, Bahamas	NAS	Active	5.0/5	50000.00	0.00	Active Inbound Handling	2026-10-04 17:09:16.764045+05:30	2026-10-04 17:09:16.764045+05:30
8c313a64-d406-4278-846f-a65f2fb3d475	AGT-002	Grand Bahama Port Logistics Agency	Trevor Sands	ops@gbportlogistics.com	+1 (242) 352-9110	Freeport Industrial Zone	Freeport Harbour Yard, Grand Bahama	FPO	Active	4.9/5	35000.00	4500.00	Active	2026-10-04 17:09:16.770637+05:30	2026-10-04 17:09:16.770637+05:30
4d9969cd-1457-4690-b98d-3f71373905fd	AGT-003	Abaco Maritime Services	Sarah Albury	clearing@abacomaritime.com	+1 (242) 367-4402	Marsh Harbour & Cays	Port Dock Road, Marsh Harbour, Abaco	MHH	Active	4.7/5	20000.00	1800.00	Active	2026-10-04 17:09:16.77338+05:30	2026-10-04 17:09:16.77338+05:30
d50eab36-678e-48df-b607-5702b1a25a76	AGT-004	Exuma Harbor Cargo Agency	Kenron Rolle	agent@exumacargo.com	+1 (242) 336-9920	George Town Harbour	Commercial Dock, George Town, Exuma	GGT	Active	4.8/5	25000.00	2100.00	Active	2026-10-04 17:09:16.775886+05:30	2026-10-04 17:09:16.775886+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, log_number, "timestamp", user_id, user_name, user_role, module, action, record_id, description, ip_address, metadata, created_at) FROM stdin;
cbdefb07-3e4e-45cf-9a7a-f69bb9c18c27	AUD-9901-432	10/4/26, 9:29 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Created Customer Profile	CUS-2026-0007	Registered customer Bahamas Trading & Logistics Co. (CUS-2026-0007, undefined - Bridgetown Deep Water Harbour).	127.0.0.1	{}	2026-10-04 21:29:19.477291+05:30
216fa1af-b69e-434b-a8de-94d0106d45c1	AUD-9902-310	10/4/26, 9:52 PM	a439c0d8-14c7-451c-ad0b-febbd53e52f6	Carlos Mendez	warehouse	House Bill of Lading	Created House Bill of Lading	HBL-2026-0001	Issued House B/L HBL-2026-0001 for Bahamas Trading & Logistics Co. linking 1 WR(s).	127.0.0.1	{}	2026-10-04 21:52:14.056102+05:30
dac6b3aa-03b2-443a-808a-3ae94a36f831	AUD-9903-951	10/4/26, 10:08 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Created Customer Profile	CUS-2026-0008	Registered customer Island Resort & Hotel Supplies Ltd. (CUS-2026-0008, undefined - Bridgetown Deep Water Harbour).	127.0.0.1	{}	2026-10-04 22:08:32.74422+05:30
3ef1dba0-2f83-47e6-948e-0f044fec20ca	AUD-9904-134	10/4/26, 10:16 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	House Bill of Lading	Created House Bill of Lading	HBL-2026-0002	Issued House B/L HBL-2026-0002 for Island Resort & Hotel Supplies Ltd. linking 1 WR(s).	127.0.0.1	{}	2026-10-04 22:16:13.620181+05:30
1bd6038e-b0e6-4e79-b183-430a6a3020c4	AUD-9905-653	10/4/26, 10:41 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Vessels	Created Vessel Record	MV Caribbean Pioneer	Added vessel MV Caribbean Pioneer (IMO:  IMO-9501142) to fleet.	127.0.0.1	{}	2026-10-04 22:41:06.214168+05:30
048f82e2-f63a-479c-affc-21f4f51db02d	AUD-9906-343	10/4/26, 10:46 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Voyages	Created Voyage Schedule	VOY-2026-115	Scheduled voyage VOY-2026-115 for vessel MV Caribbean Star.	127.0.0.1	{}	2026-10-04 22:46:32.524875+05:30
4bba59c8-3f08-41aa-b895-ab31091ff65e	AUD-9907-328	10/4/26, 10:50 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Port Management	Added Island Port Destination	KIN	Registered new port destination KIN - Kingston Wharves Terminal (Jamaica, Bahamas).	127.0.0.1	{}	2026-10-04 22:50:29.444285+05:30
372d1a2c-1aea-4756-abfc-f7b0e00eee5b	AUD-9908-421	10/4/26, 10:55 PM	a439c0d8-14c7-451c-ad0b-febbd53e52f6	Carlos Mendez	warehouse	Cargo Inventory	Updated Cargo Unit	cea481a4-789b-418c-b8b2-79e8819998b3	Updated cargo details for cea481a4-789b-418c-b8b2-79e8819998b3.	127.0.0.1	{}	2026-10-04 22:55:44.648877+05:30
eaf003bd-04e6-44a6-87b9-1e6ecbf60bbb	AUD-9909-375	10/5/26, 10:14 AM	d35369db-4c57-4fe5-ae24-1953190d151d	David Cartwright	agent	Cargo Inventory	Updated Cargo Unit	cea481a4-789b-418c-b8b2-79e8819998b3	Updated cargo details for cea481a4-789b-418c-b8b2-79e8819998b3.	127.0.0.1	{}	2026-10-05 10:14:11.468341+05:30
31e19787-5a6e-4190-928b-e0704baf7cd8	AUD-9910-136	10/12/26, 1:11 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Created Customer Profile	CUS-2026-0009	Registered customer tanvi carpo (CUS-2026-0009, KIN - Kingston Wharves Terminal).	127.0.0.1	{}	2026-10-12 13:11:23.802069+05:30
2fa22486-ea54-4c76-9d35-e7f654152d3e	AUD-9911-855	10/12/26, 1:54 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Deleted Customer Profile	CUS-2026-0001	Deleted customer profile Bahamas Marine Supplies Ltd. (CUS-2026-0001).	127.0.0.1	{}	2026-10-12 13:54:33.881598+05:30
1c339a2f-3b4c-4d10-b232-c71adba219dd	AUD-9912-365	10/12/26, 1:55 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Deleted Customer Profile	CUS-2026-0009	Deleted customer profile tanvi carpo (CUS-2026-0009).	127.0.0.1	{}	2026-10-12 13:55:09.631818+05:30
c6c0dc49-facc-4cff-8068-784b9e2ab7c2	AUD-9913-742	10/13/26, 10:59 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Customer	Created Customer Profile	CUS-2026-0009	Registered customer Marine Supplies Ltd. (CUS-2026-0009, ELH - Governor's Harbour / North Eleuthera Pier).	127.0.0.1	{}	2026-10-13 10:59:09.184552+05:30
f59cd127-2241-4ac0-a9ad-0d3e5d60f607	AUD-9914-214	10/13/26, 11:13 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	House Bill of Lading	Placed House B/L On Hold	HBL-2026-0002	Placed House B/L HBL-2026-0002 on hold. Reason: Documentation Hold	127.0.0.1	{}	2026-10-13 11:13:10.666665+05:30
3a53fccc-e024-4c36-a4b5-75f959f856b5	AUD-9915-671	10/13/26, 11:13 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	House Bill of Lading	Cleared Hold on House B/L	HBL-2026-0002	Cleared hold on House B/L HBL-2026-0002. Status is now Active.	127.0.0.1	{}	2026-10-13 11:13:13.720548+05:30
a30c0c66-a567-4270-9b74-8d2636a54991	AUD-9916-841	10/13/26, 11:17 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	House Bill of Lading	Created House Bill of Lading	HBL-2026-0003	Issued House B/L HBL-2026-0003 for Marine Supplies Ltd. linking 1 WR(s).	127.0.0.1	{}	2026-10-13 11:17:25.203362+05:30
a9774aa8-5f66-4cb2-9701-266edb4e8e51	AUD-9917-726	10/13/26, 11:20 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Shipments	Updated Shipment	SHP-2026-0002	Updated shipment details for SHP-2026-0002.	127.0.0.1	{}	2026-10-13 11:20:37.257003+05:30
ebce459d-6cfe-4578-8882-c34e2db1cbaf	AUD-9918-814	10/13/26, 11:25 AM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Shipments	Updated Shipment	SHP-2026-0002	Updated shipment details for SHP-2026-0002.	127.0.0.1	{}	2026-10-13 11:25:31.531372+05:30
ade509f3-2341-4b9d-8a59-78dfe56754c2	AUD-9919-521	10/13/26, 12:10 PM	09b9eae6-722e-4aac-b5af-6a5f0bf77030	Marcus Vance	super_admin	Shipments	Updated Shipment	SHP-2026-0002	Updated shipment details for SHP-2026-0002.	127.0.0.1	{}	2026-10-13 12:10:17.46605+05:30
\.


--
-- Data for Name: bills_of_lading; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills_of_lading (id, bl_number, type, status, shipment_id, shipment_number, consolidation_id, house_bill_ids, created_date, issue_date, shipper, consignee, notify_party, agent_id, agent_name, pre_carriage_by, place_of_receipt, ocean_vessel, voyage_number, carrier, port_of_loading, port_of_discharge, place_of_delivery, container_number, seal_number, container_type, marks_and_numbers, cargo_description, package_count, total_pieces, package_type, gross_weight_lbs, gross_weight_kg, cbm, cft, freight_payable_at, freight_terms, number_of_originals, hold_details, charges, total_freight_usd, created_at, updated_at) FROM stdin;
7658ae0f-0a27-4732-8c7a-57795e02ec6c	BL-VI-2026-0001	Master Ocean Bill of Lading	Draft	a235f5f8-509c-4368-b458-2ecc65ebd4f4	SHP-2026-0001	4c8e6e34-5cc2-4796-aad5-5d7188edaf62	[]	2026-10-04	2026-10-04	{"name": "VI Customs Brokers & Logistics", "address": "1200 NW 78th Ave, Miami, FL 33126", "contact": "+1 (305) 555-0199"}	{"name": "Caribbean Express Freight Ltd.", "address": "NAS - Nassau, Bahamas", "contact": ""}	{"name": "Caribbean Express Freight Ltd.", "address": "NAS - Nassau, Bahamas"}	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	Truck / Drayage	Miami CFS Facility	MV Island Voyager	V.2026-19E	Tropical Shipping Line	Port Everglades (USPEF)	Port of Nassau (BSNAS)	NAS - Nassau, Bahamas	CMAU-109482-7	SEAL-VI-64542	40' High Cube	CMAU-109482-7 / SEAL: SEAL-VI-64542	Consolidation of 0 House Bills / 2 packages	2	9	Packages	535.00	242.70	0.00	0.00	Miami, FL	Freight Prepaid	3 (THREE)	{"isOnHold": false}	[]	0.00	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
d22c950f-d2a8-46f8-9cfb-bb840a82847f	BL-VI-2026-0002	Master Ocean Bill of Lading	Draft	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	SHP-2026-0002	88664f50-e609-4b39-84e5-cfdb985e7c99	[]	2026-10-13	2026-10-13	{"name": "VI Customs Brokers & Logistics", "address": "1200 NW 78th Ave, Miami, FL 33126", "contact": "+1 (305) 555-0199"}	{"name": "Caribbean Express Freight Ltd.", "address": "NAS - Nassau, Bahamas", "contact": ""}	{"name": "Caribbean Express Freight Ltd.", "address": "NAS - Nassau, Bahamas"}	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	Truck / Drayage	Miami CFS Facility	MV Island Voyager	V.2026-19E	Tropical Shipping Line	Port Everglades (USPEF)	Port of Nassau (BSNAS)	NAS - Nassau, Bahamas	CMAU-109482-7	SEAL-VI-45417	40' Standard GP	CMAU-109482-7 / SEAL: SEAL-VI-45417	Consolidation of 0 House Bills / 3 packages	3	4705	Packages	67698.00	30707.30	252.80	8927.28	Miami, FL	Freight Prepaid	3 (THREE)	{"isOnHold": false}	[]	0.00	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
\.


--
-- Data for Name: cargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cargo (id, cargo_number, warehouse_receipt_id, receipt_number, customer, description, package_count, total_pieces, package_type, length_inches, width_inches, height_inches, weight_lbs, weight_kg, cft, cbm, warehouse_location, destination_port, destination_code, status, barcode, qr_code, created_at, updated_at, agent_id, agent_name) FROM stdin;
6213b204-9594-4c72-aab7-78cd78f2ff6b	CRG-3100-01	86799ccb-ec37-4db4-bc65-6a3b606edf00	3100	Bahamas Trading & Logistics Co.	5x Carton (Commercial Hardware & Electronics Supplies)	1	5	Carton	\N	\N	\N	85.00	38.60	60.00	1.70	Bay A-1 (CFS Staging)	undefined - Bridgetown Deep Water Harbour	undefined	Ready for Consolidation	CRG56932452	VI-CRG-3100	2026-10-04 21:44:54.388025+05:30	2026-10-04 21:44:54.388025+05:30	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.
cea481a4-789b-418c-b8b2-79e8819998b3	CRG-3101-01	443e2501-cc81-485e-aaf4-b5e972d7744f	3101	Island Resort & Hotel Supplies Ltd.	4x Pallet (Luxury Hotel Linens & Amenities)	2	4	Carton	24.00	20.00	18.00	450.00	204.10	10.00	0.28	Bay A-1 (CFS Staging)	NAS - Nassau Container Port (Arawak Cay)	NAS	Consolidated	CRG55053299	VI-CRG-3101	2026-10-04 22:10:51.368534+05:30	2026-10-05 10:14:11.354+05:30	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.
5a8db2b6-8e7f-42ee-a4e3-2f876a72334f	CRG-WR-2026-3102-01	fc294909-950b-4742-b24b-d3fd09a6cb63	WR-2026-3102	Marine Supplies Ltd.	1901x Bundle (Hybrid Solar Inverters 10kW), 1360x Carton (LiFePO4 Marine Battery Units), 1444x Carton (Aluminum Solar Roof Mount Rails)	3	4705	Carton	\N	\N	\N	67698.00	30707.30	8927.28	252.80	General Staging	ELH - Governor's Harbour / North Eleuthera Pier	ELH	Ready for Consolidation	CRG24646487	VI-CRG-WR-2026-3102	2026-10-13 11:11:17.010056+05:30	2026-10-13 11:11:17.010056+05:30	\N	
\.


--
-- Data for Name: consolidations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consolidations (id, consolidation_number, title, destination_port, destination_code, created_date, status, container_id, container_number, container_type, container_capacity_cbm, seal_number, vessel_id, vessel_name, voyage_id, voyage_number, carrier, loading_port, discharge_port, total_house_bills, house_bill_ids, total_receipts, receipt_ids, total_packages, total_pieces, total_weight_lbs, total_weight_kg, total_cft, total_cbm, container_fill_percentage, assigned_shipment_id, assigned_master_bl_id, notes, created_at, updated_at, agent_id, agent_name) FROM stdin;
4c8e6e34-5cc2-4796-aad5-5d7188edaf62	CNS-2026-0001	Nassau LCL Consolidated Ocean Box	NAS - Nassau, Bahamas	NAS	2026-10-04	Planning	\N	CMAU-109482-7	40' High Cube	67.70	SEAL-VI-64542	\N	MV Island Voyager	\N	V.2026-19E	Tropical Shipping Line	Port Everglades (USPEF)	Port of Nassau (BSNAS)	0	[]	2	["443e2501-cc81-485e-aaf4-b5e972d7744f", "86799ccb-ec37-4db4-bc65-6a3b606edf00"]	2	9	535.00	242.70	0.00	0.00	0.00	SHP-2026-0001	BL-VI-2026-0001	Consolidated commercial imports and retail cargo.	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30	\N	\N
88664f50-e609-4b39-84e5-cfdb985e7c99	CNS-2026-0002	Nassau LCL Consolidated Ocean Box	NAS - Nassau, Bahamas	NAS	2026-10-13	Planning	\N	CMAU-109482-7	40' Standard GP	67.70	SEAL-VI-45417	\N	MV Island Voyager	\N	V.2026-19E	Tropical Shipping Line	Port Everglades (USPEF)	Port of Nassau (BSNAS)	0	[]	1	["fc294909-950b-4742-b24b-d3fd09a6cb63"]	3	4705	67698.00	30707.30	8927.28	252.80	373.40	SHP-2026-0002	BL-VI-2026-0002	Consolidated commercial imports and retail cargo.	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30	\N	\N
\.


--
-- Data for Name: containers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.containers (id, container_number, type, carrier, seal_number, tare_weight_kg, max_payload_kg, max_volume_cbm, loaded_weight_kg, loaded_volume_cbm, fill_percentage, current_shipment_id, current_shipment_number, status, location, origin_port, discharge_port, temperature_controlled, created_at, updated_at) FROM stdin;
10f28db4-8d40-4e95-a122-a81befcb0229	MSKU-829104-5	40' High Cube Dry	Maersk Line / Tropical	SEAL-VI-8821	3880.00	28620.00	76.20	54.40	0.52	1.00	\N	\N	Available at CFS Yard	Miami CFS Yard - Bay A	Port of Miami (USMIA)	Port of Nassau (BSNAS)	f	2026-10-04 17:09:16.777816+05:30	2026-10-04 17:09:16.777816+05:30
0e140b51-b898-4945-8e72-ad0e0da92984	TGHU-918234-0	20' Standard GP	Tropical Shipping Line	SEAL-VI-9902	2230.00	21770.00	33.20	0.00	0.00	0.00	\N	\N	Available at CFS Yard	Miami CFS Yard - Bay B	Port of Miami (USMIA)	Port of Freeport (BSFPO)	f	2026-10-04 17:09:16.781673+05:30	2026-10-04 17:09:16.781673+05:30
adb74935-e649-45ff-89bc-002d01a74c4e	MEDU-440219-3	40' High Cube Dry	MSC Mediterranean	SEAL-VI-1029	3900.00	28600.00	76.20	0.00	0.00	0.00	\N	\N	Available at CFS Yard	Miami CFS Yard - Bay C	Port of Miami (USMIA)	Port of Nassau (BSNAS)	f	2026-10-04 17:09:16.78331+05:30	2026-10-04 17:09:16.78331+05:30
3d2f7f0f-f888-4f7f-affa-3d6bbdd13eeb	CMAU-772109-1	40' Reefer High Cube	CMA CGM	SEAL-VI-3341	4500.00	27500.00	67.00	0.00	0.00	0.00	\N	\N	Available at CFS Yard	Miami CFS Yard - Reefer Bay	Port of Miami (USMIA)	Port of Nassau (BSNAS)	t	2026-10-04 17:09:16.784829+05:30	2026-10-04 17:09:16.784829+05:30
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, customer_number, name, company_name, contact_person, email, telephone, phone, address, destination_port, destination_code, tax_id, account_type, credit_terms, notes, status, created_date, created_at, updated_at) FROM stdin;
f98dfea0-695f-4c78-abe7-86c9431a99da	CUS-2026-0002	Caribbean Hardware & Lumber Co.	Caribbean Hardware & Lumber Co.	David Knowles	dknowles@caribbeanhardware.com	+1 (242) 352-7740	+1 (242) 352-7740	Queen's Highway, Freeport, Grand Bahama	Port of Freeport (BSFPO)	FPO	BS-TIN-449102	Wholesaler	Net 30	Heavy building materials and hardware wholesaler.	Active	\N	2026-10-04 17:09:16.755634+05:30	2026-10-04 17:09:16.755634+05:30
86579c61-a31e-4096-bc80-7b02d05ae33f	CUS-2026-0003	Exuma Cays Provisions & Logistics	Exuma Cays Provisions & Logistics	Marcus Bethel	mbethel@exumaprovisions.com	+1 (242) 336-2210	+1 (242) 336-2210	Queen's Highway, George Town, Exuma	Port of George Town (BSGGT)	GGT	BS-TIN-330198	Commercial Importer	Net 15	Exuma yacht provisioning and resort supplies.	Active	\N	2026-10-04 17:09:16.756815+05:30	2026-10-04 17:09:16.756815+05:30
b7739c6b-c95c-4ffe-9e2f-0af5a3e7f82c	CUS-2026-0004	Abaco Building Materials Depot	Abaco Building Materials Depot	Emanuel Albury	ealbury@abacobuilding.com	+1 (242) 367-2900	+1 (242) 367-2900	Don MacKay Blvd, Marsh Harbour, Abaco	Marsh Harbour Port (BSMHH)	MHH	BS-TIN-991204	Wholesaler	Net 30	Lumber and roofing materials distributor in Abaco.	Active	\N	2026-10-04 17:09:16.75803+05:30	2026-10-04 17:09:16.75803+05:30
37a8f297-1715-4b94-90e8-68f40caf5cea	CUS-2026-0005	Eleuthera Hospitality Imports	Eleuthera Hospitality Imports	Claire Symonette	csymonette@eleutheraimports.com	+1 (242) 335-1440	+1 (242) 335-1440	Main Street, Governor's Harbour, Eleuthera	Governor's Harbour (BSGHB)	GHB	BS-TIN-774011	Commercial Importer	Prepaid	Hospitality, linen and kitchen equipment importer.	Active	\N	2026-10-04 17:09:16.759546+05:30	2026-10-04 17:09:16.759546+05:30
2eb333c8-bc31-4f86-8ff6-0d0cb61d7dd5	CUS-2026-0006	Paradise Island Resort Provisions	Paradise Island Resort Provisions Ltd.	Julian Ferguson	jferguson@paradiseresorts.com	+1 (242) 363-3000	+1 (242) 363-3000	Casino Drive, Paradise Island, Bahamas	Port of Nassau (BSNAS)	NAS	BS-TIN-119283	Commercial Importer	Net 30	Hotel & luxury hospitality consumables client.	Active	\N	2026-10-04 17:09:16.760881+05:30	2026-10-04 17:09:16.760881+05:30
0e5cfaa3-9c9c-4728-9077-aa0ac4aac0ee	CUS-2026-0007	Bahamas Trading & Logistics Co.	Bahamas Trading & Logistics Co.	John Miller	info@bahamastrading.com	+1 (242) 555-0199	+1 (242) 555-0199	Building #4, Industrial Park, Freeport, Bahamas	undefined - Bridgetown Deep Water Harbour	undefined	TIN-BS-883920	Commercial Importer	Net 30	Handle with care. Requires palletized delivery and priority customs clearance upon arrival.	Active	2026-10-04	2026-10-04 21:29:19.289732+05:30	2026-10-04 21:29:19.289732+05:30
dec8d63f-51e8-4fed-8348-8031fb86b222	CUS-2026-0008	Island Resort & Hotel Supplies Ltd.	Island Resort & Hotel Supplies Ltd.	 Sarah Jenkins	imports@islandresortsupplies.com	+1 (242) 555-0288 	+1 (242) 555-0288 	Paradise Island Drive, Suite 200, Nassau, Bahamas	undefined - Bridgetown Deep Water Harbour	undefined	TIN-BS-991024	Commercial Importer	Net 30	NAS - Nassau Container Port	Active	2026-10-04	2026-10-04 22:08:32.710219+05:30	2026-10-04 22:08:32.710219+05:30
b0ff8b05-e30e-4717-a6dc-7d49b2751e59	CUS-2026-0009	Marine Supplies Ltd.	Marine Supplies Ltd.	Capt. Aaron Sterling	procurement@bahamassolar.com	+1 (242) 352-8800	+1 (242) 352-8800	Queens Highway, Industrial Park, Freeport, Grand Bahama	ELH - Governor's Harbour / North Eleuthera Pier	ELH	TIN-BS-883920	Wholesaler / Distributor	Net 30	Fragile electronics. Keep dry, store on wooden pallets only.	Active	2026-10-13	2026-10-13 10:59:09.099262+05:30	2026-10-13 10:59:09.099262+05:30
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, document_number, entity_type, entity_id, document_type, file_name, file_url, mime_type, file_size, status, metadata, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: house_bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.house_bills (id, hbl_number, customer_id, customer_name, shipper, consignee, notify_party, agent_id, agent_name, origin_port, destination_port, destination_code, warehouse_receipt_ids, cargo_description, packages, total_packages, total_pieces, total_weight_lbs, total_weight_kg, total_cft, total_cbm, status, freight_terms, created_date, issue_date, assigned_consolidation_id, assigned_master_bl_id, assigned_shipment_id, notes, created_at, updated_at) FROM stdin;
c27b703f-ad48-4de9-9302-d8ac66697192	HBL-2026-0001	0e5cfaa3-9c9c-4728-9077-aa0ac4aac0ee	Bahamas Trading & Logistics Co.	{"name": "Miami Logistics & Wholesale Corp.\\n8500 NW 25th Street, Doral, FL 33122\\nContact: Robert Vance (+1 305-555-0188)\\n", "address": "Miami CFS Cargo Hub, FL"}	{"name": "Bahamas Trading & Logistics Co.", "taxId": "TIN-BS-883920", "address": "Building #4, Industrial Park, Freeport, Bahamas"}	{"name": "Caribbean Express Freight Ltd.", "address": "Destination Port Cargo Terminal"}	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	Port of Miami (USMIA), FL	undefined - Bridgetown Deep Water Harbour	undefined	["86799ccb-ec37-4db4-bc65-6a3b606edf00"]	5x Carton (Commercial Hardware & Electronics Supplies)	[{"id": "PKG-001", "cbm": 1.7, "cft": 60, "pieces": 5, "weightLbs": 85, "description": "Commercial Hardware & Electronics Supplies", "packageType": "Carton", "widthInches": 24, "heightInches": 24, "lengthInches": 36}]	1	5	85.00	38.60	0.00	0.00	Active	Freight Prepaid	2026-10-04	2026-10-04	\N	\N	\N	Created linking 1 Warehouse Receipt(s).	2026-10-04 21:52:13.974573+05:30	2026-10-04 21:52:13.974573+05:30
01fa4fec-a4c5-4b7f-a886-0d9d0ed62f5b	HBL-2026-0002	dec8d63f-51e8-4fed-8348-8031fb86b222	Island Resort & Hotel Supplies Ltd.	{"name": "Global Hotel Amenities & Linens Inc.\\n4500 SW 75th Ave, Miami, FL 33155\\nPhone: +1 (305) 555-4420\\n", "address": "Miami CFS Cargo Hub, FL"}	{"name": "Island Resort & Hotel Supplies Ltd.", "taxId": "TIN-BS-991024", "address": "Paradise Island Drive, Suite 200, Nassau, Bahamas"}	{"name": "Caribbean Express Freight Ltd.", "address": "Destination Port Cargo Terminal"}	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	Port of Miami (USMIA), FL	undefined - Bridgetown Deep Water Harbour	undefined	["443e2501-cc81-485e-aaf4-b5e972d7744f"]	4x Pallet (Luxury Hotel Linens & Amenities)	[{"id": "PKG-001", "cbm": 7.55, "cft": 266.67, "pieces": 4, "weightLbs": 450, "description": "Luxury Hotel Linens & Amenities", "packageType": "Pallet", "widthInches": 40, "heightInches": 60, "lengthInches": 48}]	1	4	450.00	204.10	0.00	0.00	Active	Freight Prepaid	2026-10-04	2026-10-04	\N	\N	\N	HOLD: Documentation Hold - Awaiting clearance	2026-10-04 22:16:13.567452+05:30	2026-10-13 11:13:13.702+05:30
05279222-8e28-4075-8e66-b199b597e2da	HBL-2026-0003	b0ff8b05-e30e-4717-a6dc-7d49b2751e59	Marine Supplies Ltd.	{"name": "Marine Supplies Ltd.\\nQueens Highway, Industrial Park, Freeport, Grand Bahama\\nPhone: +1 (242) 352-8800", "address": "Miami CFS Cargo Hub, FL"}	{"name": "Marine Supplies Ltd.", "taxId": "TIN-BS-883920", "address": "Queens Highway, Industrial Park, Freeport, Grand Bahama"}	{"name": "Direct Consignee Delivery", "address": "Destination Port Cargo Terminal"}	\N	\N	Port of Miami (USMIA), FL	ELH - Governor's Harbour / North Eleuthera Pier	ELH	["WR-2026-3102"]	1901x Bundle (Hybrid Solar Inverters 10kW), 1360x Carton (LiFePO4 Marine Battery Units), 1444x Carton (Aluminum Solar Roof Mount Rails)	[{"id": "PKG-001", "cbm": 44.86, "cft": 1584.17, "pieces": 1901, "weightLbs": 18, "description": "Hybrid Solar Inverters 10kW", "packageType": "Bundle", "widthInches": 30, "heightInches": 24, "lengthInches": 2}, {"id": "PKG-002", "cbm": 17.12, "cft": 604.44, "pieces": 1360, "weightLbs": 14, "description": "LiFePO4 Marine Battery Units", "packageType": "Carton", "widthInches": 24, "heightInches": 16, "lengthInches": 2}, {"id": "PKG-003", "cbm": 190.82, "cft": 6738.67, "pieces": 1444, "weightLbs": 10, "description": "Aluminum Solar Roof Mount Rails", "packageType": "Carton", "widthInches": 84, "heightInches": 12, "lengthInches": 8}]	3	4705	67698.00	30707.30	8927.28	252.80	Active	Freight Prepaid	2026-10-13	2026-10-13	\N	\N	\N	Created linking 1 Warehouse Receipt(s).\n---FREIGHT_CHARGES---\n{"rateBasis":"cft","rate":3.5,"oceanFreightAmount":31245.48,"documentationFee":50,"terminalHandlingFee":35,"customsFee":0,"totalAmount":31330.48,"currency":"USD"}	2026-10-13 11:17:25.179319+05:30	2026-10-13 11:17:25.179319+05:30
\.


--
-- Data for Name: manifests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manifests (id, manifest_number, type, title, vessel_name, voyage_number, flag, master_name, port_of_loading, port_of_discharge, departure_date, arrival_date, carrier, total_bls, total_house_bills, total_containers, total_packages, total_pieces, total_weight_lbs, total_weight_kg, total_cbm, total_cft, status, master_bl_number, line_items, created_at, updated_at) FROM stdin;
1ccfc550-f06b-4cdd-8398-d451055d3f35	MNF-2026-0001	Ocean Cargo Inward / Outward Manifest	Ocean Cargo Manifest - NAS - Nassau, Bahamas (MV Island Voyager / V.2026-19E)	MV Island Voyager	V.2026-19E	Bahamas	Capt. E. Smith	Port Everglades (USPEF)	Port of Nassau (BSNAS)	2026-10-04	2026-09-06	Tropical Shipping Line	1	0	1	2	9	535.00	242.70	0.00	0.00	Generated	BL-VI-2026-0001	[]	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
6755eb99-f2df-4628-8f15-daf0cee5f057	MNF-2026-0002	Ocean Cargo Inward / Outward Manifest	Ocean Cargo Manifest - NAS - Nassau, Bahamas (MV Island Voyager / V.2026-19E)	MV Island Voyager	V.2026-19E	Bahamas	Capt. E. Smith	Port Everglades (USPEF)	Port of Nassau (BSNAS)	2026-10-13	2026-09-06	Tropical Shipping Line	1	0	1	3	4705	67698.00	30707.30	252.80	8927.28	Generated	BL-VI-2026-0002	[]	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, role_id, module, can_view, can_create, can_edit, can_delete, extra_actions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ports (id, port_code, name, island, country, status, default_agent, created_at, updated_at) FROM stdin;
1f191f8c-0a91-4d46-a7d9-ccf98b3bcb2b	NAS	Nassau Container Port (Arawak Cay)	New Providence	Bahamas	Active	\N	2026-10-04 17:09:16.734781+05:30	2026-10-04 17:09:16.734781+05:30
d1b8cfaa-6538-4c82-b970-2788d6125242	FPO	Freeport Container Port	Grand Bahama	Bahamas	Active	\N	2026-10-04 17:09:16.738363+05:30	2026-10-04 17:09:16.738363+05:30
b3b6f05b-3161-478d-ac13-f85f53c8e549	MHH	Marsh Harbour Freight Terminal	Abaco	Bahamas	Active	\N	2026-10-04 17:09:16.73975+05:30	2026-10-04 17:09:16.73975+05:30
9e6d370e-3abc-4c2f-a2e7-4cca7ac153d0	GGT	George Town Harbour Cargo Pier	Exuma	Bahamas	Active	\N	2026-10-04 17:09:16.741122+05:30	2026-10-04 17:09:16.741122+05:30
987a317d-4d4f-41b1-9b1d-3184afd9ef1b	ELH	Governor's Harbour / North Eleuthera Pier	Eleuthera	Bahamas	Active	\N	2026-10-04 17:09:16.742756+05:30	2026-10-04 17:09:16.742756+05:30
90771099-5be6-4eba-971d-15c637556edb	PLS	Providenciales Commercial Port (South Dock)	Providenciales	Turks & Caicos	Active	\N	2026-10-04 17:09:16.744363+05:30	2026-10-04 17:09:16.744363+05:30
d0373a6b-690b-4d9d-8b70-eb81006d0613	GCM	George Town Port Authority Cargo Terminal	Grand Cayman	Cayman Islands	Active	\N	2026-10-04 17:09:16.745847+05:30	2026-10-04 17:09:16.745847+05:30
625b83a1-c4bc-407a-a2ff-d6292a54ebc4	BGI	Bridgetown Deep Water Harbour	Barbados	Barbados	Active	\N	2026-10-04 17:09:16.747701+05:30	2026-10-04 17:09:16.747701+05:30
ec48588a-5f45-453c-b1cf-64e6abbd25fa	POS	Port of Spain Harbor Cargo Terminal	Trinidad	Trinidad & Tobago	Active	\N	2026-10-04 17:09:16.749196+05:30	2026-10-04 17:09:16.749196+05:30
b4d471d4-c08e-4aef-9f73-76bbb6ad0dd7	MIA	Port of Miami (USMIA)	Florida Origin	United States	Active	\N	2026-10-04 17:09:16.750546+05:30	2026-10-04 17:09:16.750546+05:30
ef36ee3c-d821-48ab-930f-1d3100ab5c3a	KIN	Kingston Wharves Terminal	Jamaica	Bahamas	Active	David Cartwright	2026-10-04 17:09:16.746785+05:30	2026-10-04 22:50:29.338+05:30
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_key, role_name, description, created_at, updated_at) FROM stdin;
cc8aa445-4581-482f-97f5-178f81a5d50b	super_admin	Super Admin	Default system role for Super Admin	2026-10-04 17:09:16.717413+05:30	2026-10-04 17:09:16.717413+05:30
4aaaeae5-e33b-45e1-8141-2a82971e4d68	operations	Operations Coordinator	Default system role for Operations Coordinator	2026-10-04 17:09:16.723335+05:30	2026-10-04 17:09:16.723335+05:30
e1b28e11-703b-4bf4-bd35-744305744596	warehouse	Warehouse Staff	Default system role for Warehouse Staff	2026-10-04 17:09:16.726227+05:30	2026-10-04 17:09:16.726227+05:30
e585d85d-300e-48f3-bc7f-82c091ffe44c	documentation	Documentation Staff	Default system role for Documentation Staff	2026-10-04 17:09:16.729835+05:30	2026-10-04 17:09:16.729835+05:30
032dc154-c77c-4443-a6d7-1b56e3fb71b2	agent	Agent	Default system role for Agent	2026-10-04 17:09:16.731138+05:30	2026-10-04 17:09:16.731138+05:30
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, description, updated_at) FROM stdin;
204d8a2c-60a5-4008-ae21-265cf0673f4d	numberingRules	{"manifestPrefix": "MNF-2026-", "shipmentPrefix": "SHP-2026-", "houseBillPrefix": "HBL-2026-", "billOfLadingPrefix": "BL-VI-2026-", "consolidationPrefix": "CNS-2026-", "warehouseReceiptStart": 3100, "warehouseReceiptPrefix": "WR-2026-"}	System-wide document and receipt numbering rules	2026-10-04 17:09:16.9416+05:30
5c9804a7-d550-46cb-bb75-0691051f3bdb	companyProfile	{"city": "Miami", "email": "operations@vicustoms.com", "phone": "+1 (305) 555-5377", "state": "Florida", "taxId": "EIN-59-9948210", "country": "United States", "zipCode": "33166", "fmcNumber": "FMC-OTI #028914N", "legalName": "VI Customs Brokers & Logistics Inc.", "companyName": "VI Customs Brokers & Logistics", "addressLine1": "8400 NW 36th Street, Suite 500"}	Official corporate branding, FMC license and Miami CFS contact info	2026-10-04 17:09:16.94477+05:30
7c34bd2a-daad-4970-bc7f-ef5626f40095	labelSettings	{"rollSize": "4x6", "barcodeType": "Code 128", "includeQrCode": true, "primaryMeasurement": "CFT", "includeHandlingIcons": true}	Miami CFS thermal label printer and barcode specifications	2026-10-04 17:09:16.945599+05:30
36b23fb0-5273-441b-a4d1-45d23603ad94	unitsAndCurrencies	{"defaultCurrency": "USD ($)", "defaultVolumeUnit": "CFT (Primary) / CBM", "defaultWeightUnit": "LBS"}	Maritime freight standard calculation units and trade currency	2026-10-04 17:09:16.946418+05:30
5771a840-e537-4a18-a9d2-6184ae2d73d2	role_permissions	{"agent": ["dashboard", "agent-portal", "shipments", "consolidations", "manifests", "bills-of-lading", "cargo", "tracking", "documents"], "warehouse": ["customers", "warehouse-receipts", "cargo", "documents", "house-bills", "consolidations", "tracking", "dashboard"], "operations": ["dashboard", "customers", "warehouse-receipts", "cargo", "documents", "house-bills", "consolidations", "shipments", "manifests", "containers", "vessels", "tracking", "history"], "super_admin": ["dashboard", "customers", "cargo", "documents", "house-bills", "consolidations", "shipments", "bills-of-lading", "manifests", "containers", "vessels", "tracking", "agent-portal", "hold-authorization", "users", "audit", "history", "settings", "warehouse-receipts"], "documentation": ["dashboard", "customers", "warehouse-receipts", "documents", "house-bills", "bills-of-lading", "manifests", "consolidations", "containers", "vessels", "tracking", "history", "hold-authorization"]}	Toggled module dashboard for role warehouse	2026-10-10 11:39:10.946+05:30
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipments (id, shipment_number, type, service_mode, status, tracking_number, origin, destination, destination_port, destination_code, agent_id, agent_name, vessel_name, voyage_number, carrier, container_number, container_type, seal_number, bill_of_lading_id, bill_of_lading_number, bl_status, manifest_number, total_packages, total_weight_lbs, total_weight_kg, total_cft, total_cbm, etd, eta, created_date, warehouse_receipt_ids, consolidation_id, current_location, tracking_checkpoints, created_at, updated_at) FROM stdin;
a235f5f8-509c-4368-b458-2ecc65ebd4f4	SHP-2026-0001	Ocean LCL Consolidation	Port-to-Port	Consolidated	TRK-VI-622086	Port Everglades (USPEF)	Port of Nassau (BSNAS)	NAS - Nassau, Bahamas	NAS	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	MV Island Voyager	V.2026-19E	Tropical Shipping Line	CMAU-109482-7	40' High Cube	SEAL-VI-64542	BL-VI-2026-0001	BL-VI-2026-0001	Draft	MNF-2026-0001	2	535.00	242.70	0.00	0.00	2026-10-04	2026-09-06	2026-10-04	["443e2501-cc81-485e-aaf4-b5e972d7744f", "86799ccb-ec37-4db4-bc65-6a3b606edf00"]	CNS-2026-0001	Miami CFS Warehouse	[{"id": "ev-1", "date": "2026-10-04", "notes": "Cargo received and staged", "stage": "Cargo Received", "status": "Completed", "location": "Miami CFS Warehouse"}, {"id": "ev-2", "date": "2026-10-04", "notes": "Consolidated into CNS-2026-0001", "stage": "Consolidated", "status": "Completed", "location": "Miami CFS Warehouse"}, {"id": "ev-3", "date": "2026-10-04", "notes": "Awaiting container loading & seal", "stage": "Loaded & Sealed", "status": "Pending", "location": "Miami CFS Yard"}, {"id": "ev-4", "date": "2026-10-04", "notes": "Vessel departure", "stage": "In Transit", "status": "Pending", "location": "Port of Miami (USMIA)"}, {"id": "ev-5", "date": "2026-09-06", "notes": "Vessel arrival at discharge port", "stage": "Arrived at Port", "status": "Pending", "location": "NAS - Nassau, Bahamas"}, {"id": "ev-6", "date": "2026-09-06", "notes": "Customs cleared & released", "stage": "Delivered / Released", "status": "Pending", "location": "NAS - Nassau, Bahamas"}]	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	SHP-2026-0002	Ocean LCL Consolidation	Port-to-Port	Delivered / Released	TRK-VI-544714	Port Everglades (USPEF)	Port of Nassau (BSNAS)	NAS - Nassau, Bahamas	NAS	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	MV Island Voyager	V.2026-19E	Tropical Shipping Line	CMAU-109482-7	40' Standard GP	SEAL-VI-45417	BL-VI-2026-0002	BL-VI-2026-0002	Draft	MNF-2026-0002	3	67698.00	30707.30	8927.28	252.80	2026-10-13	2026-09-06	2026-10-13	["fc294909-950b-4742-b24b-d3fd09a6cb63"]	CNS-2026-0002	NAS - Nassau, Bahamas	[{"id": "ev-1", "date": "2026-10-13", "notes": "Cargo received and staged", "stage": "Cargo Received", "status": "Completed", "location": "Miami CFS Warehouse"}, {"id": "ev-2", "date": "2026-10-13", "notes": "Consolidated into CNS-2026-0002", "stage": "Consolidated", "status": "Completed", "location": "Miami CFS Warehouse"}, {"id": "ev-3", "date": "2026-10-13", "time": "11:20 AM", "notes": "Container CMAU-109482-7 stuffed and secured with Bolt Seal SEAL-VI-45417. Verified by Marcus Vance.", "stage": "Loaded & Sealed", "status": "Completed", "location": "Port Everglades (USPEF)"}, {"id": "ev-4", "date": "2026-10-13", "time": "11:25 AM", "notes": "Vessel MV Island Voyager (Voyage V.2026-19E) departed from Port Everglades (USPEF). Sailing to NAS - Nassau, Bahamas. Carrier: Tropical Shipping Line. Logged by Marcus Vance.", "stage": "In Transit", "status": "Completed", "location": "MV Island Voyager (V.2026-19E)"}, {"id": "ev-5", "date": "2026-09-06", "notes": "Vessel arrival at discharge port", "stage": "Arrived at Port", "status": "Completed", "location": "NAS - Nassau, Bahamas"}, {"id": "ev-6", "date": "2026-10-13", "time": "12:10 PM", "notes": "Cargo cleared customs and released for final consignee delivery under B/L BL-VI-2026-0002. Verified by Marcus Vance.", "stage": "Delivered / Released", "status": "Completed", "location": "NAS - Nassau, Bahamas"}]	2026-10-13 11:20:08.742478+05:30	2026-10-13 12:10:17.445+05:30
\.


--
-- Data for Name: tracking_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tracking_events (id, tracking_number, shipment_id, stage, status, event_date, event_time, location, notes, checkpoint_index, created_at, updated_at) FROM stdin;
4b4fb45d-9841-4c4a-984e-c289918bae85	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	Cargo Received	Completed	2026-10-04	08:30 AM	Miami CFS Warehouse	Cargo received and inventoried at Miami CFS	0	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
16d9a669-9116-462d-9a73-ee3646b06d4c	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	Consolidated	Completed	2026-10-04	11:00 AM	Miami CFS Warehouse	Consolidated under master shipment SHP-2026-0001 / Box CNS-2026-0001	1	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
0a857c2a-831b-4776-8efd-e54b49ee9378	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	Loaded & Sealed	Pending	2026-10-04	02:00 PM	Miami CFS Yard	Stuffed into container CMAU-109482-7, seal SEAL-VI-64542	2	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
fa6610e6-a2de-47c4-8caa-b441b4e865b9	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	In Transit	Pending	2026-10-04	06:00 PM	Port of Miami (USMIA)	Vessel departed origin en route to NAS - Nassau, Bahamas	3	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
edc67af5-63b6-45a6-ace4-9f91b367ccc6	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	Arrived at Port	Pending	2026-09-06	09:00 AM	NAS - Nassau, Bahamas	Vessel arrived at destination port of discharge	4	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
85189165-729f-44bc-a91e-cff8e46d2111	TRK-VI-622086	a235f5f8-509c-4368-b458-2ecc65ebd4f4	Delivered / Released	Pending	2026-09-06	04:00 PM	NAS - Nassau, Bahamas	Consignment cleared through customs and released to agent	5	2026-10-04 22:19:49.066259+05:30	2026-10-04 22:19:49.066259+05:30
2da7fc03-c3f2-43b4-bdfa-7d7bcde41069	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	Cargo Received	Completed	2026-10-13	08:30 AM	Miami CFS Warehouse	Cargo received and inventoried at Miami CFS	0	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
d00674a6-cfd7-47af-9796-f6157b2c5ee4	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	Consolidated	Completed	2026-10-13	11:00 AM	Miami CFS Warehouse	Consolidated under master shipment SHP-2026-0002 / Box CNS-2026-0002	1	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
7b68f52a-7da0-4bf3-828a-7475909c72da	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	Loaded & Sealed	Pending	2026-10-13	02:00 PM	Miami CFS Yard	Stuffed into container CMAU-109482-7, seal SEAL-VI-45417	2	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
d8a5495a-69dc-4ed0-8f0c-46f9c02e1e6d	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	In Transit	Pending	2026-10-13	06:00 PM	Port of Miami (USMIA)	Vessel departed origin en route to NAS - Nassau, Bahamas	3	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
4c7c4b35-0e07-416b-8e5a-99290d174106	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	Arrived at Port	Pending	2026-09-06	09:00 AM	NAS - Nassau, Bahamas	Vessel arrived at destination port of discharge	4	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
ff684809-97ee-4b34-b93a-ca7106e706bd	TRK-VI-544714	a2e282c0-c4e6-4cca-a7ab-fc5002d661d2	Delivered / Released	Pending	2026-09-06	04:00 PM	NAS - Nassau, Bahamas	Consignment cleared through customs and released to agent	5	2026-10-13 11:20:08.742478+05:30	2026-10-13 11:20:08.742478+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, user_code, email, password_hash, name, role_key, department, status, avatar, last_login, phone, agent_id, created_at, updated_at) FROM stdin;
09b9eae6-722e-4aac-b5af-6a5f0bf77030	USR-001	marcus.vance@vicustoms.com	$2a$10$Pnr60Iz6xuMPVcn5J7Kg1./0AlTdIPLonV.LYQqDZgvnsA307cEzG	Marcus Vance	super_admin	Executive & Global Operations	Active	MV	\N	+1 (305) 555-0100	\N	2026-10-04 17:09:16.928758+05:30	2026-10-04 17:09:16.928758+05:30
164b5617-b09a-474d-8815-ffa857b9f30e	USR-002	sarah.j@vicustoms.com	$2a$10$Pnr60Iz6xuMPVcn5J7Kg1./0AlTdIPLonV.LYQqDZgvnsA307cEzG	Sarah Jenkins	documentation	B/L Documentation & Billing	Active	SJ	\N	+1 (305) 555-0142	\N	2026-10-04 17:09:16.934722+05:30	2026-10-04 17:09:16.934722+05:30
a439c0d8-14c7-451c-ad0b-febbd53e52f6	USR-003	carlos.m@vicustoms.com	$2a$10$Pnr60Iz6xuMPVcn5J7Kg1./0AlTdIPLonV.LYQqDZgvnsA307cEzG	Carlos Mendez	warehouse	Miami CFS Warehouse	Active	CM	\N	+1 (305) 555-0188	\N	2026-10-04 17:09:16.936234+05:30	2026-10-04 17:09:16.936234+05:30
d35369db-4c57-4fe5-ae24-1953190d151d	USR-004	operations@caribbeanexpressbahamas.com	$2a$10$Pnr60Iz6xuMPVcn5J7Kg1./0AlTdIPLonV.LYQqDZgvnsA307cEzG	David Cartwright	agent	Caribbean Express Freight Ltd. (Bahamas)	Active	DC	\N	+1 (242) 555-9000	833f25c0-703c-47cd-a767-3910720e0cd3	2026-10-04 17:09:16.93821+05:30	2026-10-04 17:09:16.93821+05:30
54e4793a-7d2e-4645-b7c4-3950d729b37f	USR-005	elena.r@vicustoms.com	$2a$10$Pnr60Iz6xuMPVcn5J7Kg1./0AlTdIPLonV.LYQqDZgvnsA307cEzG	Elena Rostova	operations	Vessel Operations & Consolidations	Active	ER	\N	+1 (305) 555-0199	\N	2026-10-04 17:09:16.932931+05:30	2026-10-04 17:09:16.932931+05:30
\.


--
-- Data for Name: vessels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vessels (id, name, imo_number, flag, type, carrier, capacity_teu, deadweight_tonnage, built_year, status, current_voyage, active_route, eta_next_port, created_at, updated_at) FROM stdin;
7f8a2f31-42dd-42d4-9cd6-44450a47784b	MV Caribbean Star	9482019	Bahamas	Container Feeder	Tropical Shipping Line	1100	12500	2018	Active	V.2026-35S	Miami CFS -> Nassau -> Freeport	2026-10-06	2026-10-04 17:09:16.786772+05:30	2026-10-04 17:09:16.786772+05:30
424d8bcc-dc2c-4112-8abb-973818088d0e	Tropical Island Voyager	9314052	Panama	Geared Container Vessel	Seaboard Marine	850	9800	2015	Active	V.2026-42E	Miami CFS -> George Town -> Marsh Harbour	2026-10-08	2026-10-04 17:09:16.796457+05:30	2026-10-04 17:09:16.796457+05:30
622048e1-7884-4cb4-b7e9-eb13bf094964	MV Caribbean Pioneer	 IMO-9501142	Bahamas (BHS)	Geared Feeder Container Vessel	Seaboard Marine Bahamas	10	350	\N	In Port (Discharging)	VOY-2026-376	Miami → Bahamas Out-Islands Loop	\N	2026-10-04 22:41:06.162454+05:30	2026-10-04 22:41:06.162454+05:30
\.


--
-- Data for Name: voyages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voyages (id, voyage_number, vessel_id, vessel_name, carrier, origin_port, destination_port, departure_date, arrival_date, status, assigned_shipments_count, total_teu_utilized, created_at, updated_at) FROM stdin;
d8936ba6-48c2-43df-87fe-90f3dcd04cfb	V.2026-35S	7f8a2f31-42dd-42d4-9cd6-44450a47784b	MV Caribbean Star	Tropical Shipping Line	Port of Miami (USMIA)	Port of Nassau (BSNAS)	2026-10-02	2026-10-06	Scheduled	2	2.00	2026-10-04 17:09:16.791819+05:30	2026-10-04 17:09:16.791819+05:30
2d5d3a30-3b60-43c9-b0cb-0dab1932b715	VOY-2026-115	7f8a2f31-42dd-42d4-9cd6-44450a47784b	MV Caribbean Star	Tropical Shipping	undefined - Bridgetown Deep Water Harbour	undefined - Bridgetown Deep Water Harbour	2026-10-04	2026-09-06	Scheduled	0	0.00	2026-10-04 22:46:32.490112+05:30	2026-10-04 22:46:32.490112+05:30
\.


--
-- Data for Name: warehouse_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_receipts (id, receipt_number, sequence_number, date, "time", customer_id, customer_name, shipper, consignee, agent_id, agent_name, destination_port, destination_code, cargo_description, package_count, total_pieces, package_type, packages, length_inches, width_inches, height_inches, weight_lbs, weight_kg, total_cft, total_cbm, warehouse_location, status, hazardous, fragile, notes, barcode, qr_code, assigned_house_bill_id, assigned_consolidation_id, assigned_shipment_id, created_at, updated_at) FROM stdin;
fc294909-950b-4742-b24b-d3fd09a6cb63	WR-2026-3102	3102	2026-10-13	11:11 AM	b0ff8b05-e30e-4717-a6dc-7d49b2751e59	Marine Supplies Ltd.	Marine Supplies Ltd.\nQueens Highway, Industrial Park, Freeport, Grand Bahama\nPhone: +1 (242) 352-8800	Marine Supplies Ltd.\nQueens Highway, Industrial Park, Freeport, Grand Bahama\nAttn: Capt. Aaron Sterling (+1 (242) 352-8800)	\N		ELH - Governor's Harbour / North Eleuthera Pier	ELH	1901x Bundle (Hybrid Solar Inverters 10kW), 1360x Carton (LiFePO4 Marine Battery Units), 1444x Carton (Aluminum Solar Roof Mount Rails)	3	4705	Carton	[{"id": "PKG-001", "cbm": 44.86, "cft": 1584.17, "pieces": 1901, "weightLbs": 18, "description": "Hybrid Solar Inverters 10kW", "packageType": "Bundle", "widthInches": 30, "heightInches": 24, "lengthInches": 2}, {"id": "PKG-002", "cbm": 17.12, "cft": 604.44, "pieces": 1360, "weightLbs": 14, "description": "LiFePO4 Marine Battery Units", "packageType": "Carton", "widthInches": 24, "heightInches": 16, "lengthInches": 2}, {"id": "PKG-003", "cbm": 190.82, "cft": 6738.67, "pieces": 1444, "weightLbs": 10, "description": "Aluminum Solar Roof Mount Rails", "packageType": "Carton", "widthInches": 84, "heightInches": 12, "lengthInches": 8}]	\N	\N	\N	67698.00	30707.30	8927.28	252.80	General Staging	Consolidated	f	t	testing recipts	WR1354950202	VI-WR-2026-3102-ELH-4705PK	HBL-2026-0003	CNS-2026-0002	\N	2026-10-13 11:11:17.002372+05:30	2026-10-13 11:20:08.77+05:30
86799ccb-ec37-4db4-bc65-6a3b606edf00	3100	3100	2026-10-04	09:44 PM	0e5cfaa3-9c9c-4728-9077-aa0ac4aac0ee	Bahamas Trading & Logistics Co.	Miami Logistics & Wholesale Corp.\n8500 NW 25th Street, Doral, FL 33122\nContact: Robert Vance (+1 305-555-0188)\n	Bahamas Trading & Logistics Co.\nBuilding #4, Industrial Park, Freeport, Bahamas\nAttn: John Miller (+1 242-555-0199)\n	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	undefined - Bridgetown Deep Water Harbour	undefined	5x Carton (Commercial Hardware & Electronics Supplies)	1	5	Carton	[{"id": "PKG-001", "cbm": 1.7, "cft": 60, "pieces": 5, "weightLbs": 85, "description": "Commercial Hardware & Electronics Supplies", "packageType": "Carton", "widthInches": 24, "heightInches": 24, "lengthInches": 36}]	\N	\N	\N	85.00	38.60	60.00	1.70	Bay A-1 (CFS Staging)	Consolidated	f	t	Received 5 cartons in good outer condition. Shrink-wrapped and staged at Bay A-1 for container consolidation.\n	WR4983820803	VI-3100-undefined-5PK	HBL-2026-0001	CNS-2026-0001	\N	2026-10-04 21:44:54.358139+05:30	2026-10-04 22:19:49.111+05:30
443e2501-cc81-485e-aaf4-b5e972d7744f	3101	3101	2026-10-04	10:10 PM	dec8d63f-51e8-4fed-8348-8031fb86b222	Island Resort & Hotel Supplies Ltd.	Global Hotel Amenities & Linens Inc.\n4500 SW 75th Ave, Miami, FL 33155\nPhone: +1 (305) 555-4420\n	Island Resort & Hotel Supplies Ltd.\nParadise Island Drive, Suite 200, Nassau, Bahamas\nAttn: Sarah Jenkins (+1 242-555-0288)\n	833f25c0-703c-47cd-a767-3910720e0cd3	Caribbean Express Freight Ltd.	NAS - Nassau Container Port (Arawak Cay)	NAS	4x Pallet (Luxury Hotel Linens & Amenities)	1	4	Carton	[{"id": "PKG-001", "cbm": 7.55, "cft": 266.67, "pieces": 4, "weightLbs": 450, "description": "Luxury Hotel Linens & Amenities", "packageType": "Pallet", "widthInches": 40, "heightInches": 60, "lengthInches": 48}]	\N	\N	\N	450.00	204.10	266.67	7.55	Bay A-1 (CFS Staging)	Consolidated	f	t	 High-priority resort cargo. Keep dry and store at Bay A-2.	WR6902720511	VI-3101-NAS-4PK	HBL-2026-0002	CNS-2026-0001	\N	2026-10-04 22:10:51.349975+05:30	2026-10-04 22:19:49.111+05:30
\.


--
-- Name: agents agents_agent_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_agent_code_unique UNIQUE (agent_code);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_log_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_log_number_unique UNIQUE (log_number);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bills_of_lading bills_of_lading_bl_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills_of_lading
    ADD CONSTRAINT bills_of_lading_bl_number_unique UNIQUE (bl_number);


--
-- Name: bills_of_lading bills_of_lading_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills_of_lading
    ADD CONSTRAINT bills_of_lading_pkey PRIMARY KEY (id);


--
-- Name: cargo cargo_cargo_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_cargo_number_unique UNIQUE (cargo_number);


--
-- Name: cargo cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: consolidations consolidations_consolidation_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidations
    ADD CONSTRAINT consolidations_consolidation_number_unique UNIQUE (consolidation_number);


--
-- Name: consolidations consolidations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidations
    ADD CONSTRAINT consolidations_pkey PRIMARY KEY (id);


--
-- Name: containers containers_container_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.containers
    ADD CONSTRAINT containers_container_number_unique UNIQUE (container_number);


--
-- Name: containers containers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.containers
    ADD CONSTRAINT containers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_customer_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_number_unique UNIQUE (customer_number);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: documents documents_document_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_document_number_unique UNIQUE (document_number);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: house_bills house_bills_hbl_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_bills
    ADD CONSTRAINT house_bills_hbl_number_unique UNIQUE (hbl_number);


--
-- Name: house_bills house_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_bills
    ADD CONSTRAINT house_bills_pkey PRIMARY KEY (id);


--
-- Name: manifests manifests_manifest_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manifests
    ADD CONSTRAINT manifests_manifest_number_unique UNIQUE (manifest_number);


--
-- Name: manifests manifests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manifests
    ADD CONSTRAINT manifests_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: ports ports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ports
    ADD CONSTRAINT ports_pkey PRIMARY KEY (id);


--
-- Name: ports ports_port_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ports
    ADD CONSTRAINT ports_port_code_unique UNIQUE (port_code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_role_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_key_unique UNIQUE (role_key);


--
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_shipment_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_shipment_number_unique UNIQUE (shipment_number);


--
-- Name: shipments shipments_tracking_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_tracking_number_unique UNIQUE (tracking_number);


--
-- Name: tracking_events tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT tracking_events_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_code_unique UNIQUE (user_code);


--
-- Name: vessels vessels_imo_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_imo_number_unique UNIQUE (imo_number);


--
-- Name: vessels vessels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_pkey PRIMARY KEY (id);


--
-- Name: voyages voyages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyages
    ADD CONSTRAINT voyages_pkey PRIMARY KEY (id);


--
-- Name: voyages voyages_voyage_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyages
    ADD CONSTRAINT voyages_voyage_number_unique UNIQUE (voyage_number);


--
-- Name: warehouse_receipts warehouse_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_pkey PRIMARY KEY (id);


--
-- Name: warehouse_receipts warehouse_receipts_receipt_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_receipt_number_unique UNIQUE (receipt_number);


--
-- Name: warehouse_receipts warehouse_receipts_sequence_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_sequence_number_unique UNIQUE (sequence_number);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bills_of_lading bills_of_lading_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills_of_lading
    ADD CONSTRAINT bills_of_lading_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: bills_of_lading bills_of_lading_consolidation_id_consolidations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills_of_lading
    ADD CONSTRAINT bills_of_lading_consolidation_id_consolidations_id_fk FOREIGN KEY (consolidation_id) REFERENCES public.consolidations(id);


--
-- Name: cargo cargo_warehouse_receipt_id_warehouse_receipts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_warehouse_receipt_id_warehouse_receipts_id_fk FOREIGN KEY (warehouse_receipt_id) REFERENCES public.warehouse_receipts(id) ON DELETE CASCADE;


--
-- Name: consolidations consolidations_container_id_containers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidations
    ADD CONSTRAINT consolidations_container_id_containers_id_fk FOREIGN KEY (container_id) REFERENCES public.containers(id);


--
-- Name: consolidations consolidations_vessel_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidations
    ADD CONSTRAINT consolidations_vessel_id_vessels_id_fk FOREIGN KEY (vessel_id) REFERENCES public.vessels(id);


--
-- Name: consolidations consolidations_voyage_id_voyages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidations
    ADD CONSTRAINT consolidations_voyage_id_voyages_id_fk FOREIGN KEY (voyage_id) REFERENCES public.voyages(id);


--
-- Name: house_bills house_bills_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_bills
    ADD CONSTRAINT house_bills_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: house_bills house_bills_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_bills
    ADD CONSTRAINT house_bills_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: permissions permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: shipments shipments_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: tracking_events tracking_events_shipment_id_shipments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT tracking_events_shipment_id_shipments_id_fk FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: users users_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: voyages voyages_vessel_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyages
    ADD CONSTRAINT voyages_vessel_id_vessels_id_fk FOREIGN KEY (vessel_id) REFERENCES public.vessels(id);


--
-- Name: warehouse_receipts warehouse_receipts_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: warehouse_receipts warehouse_receipts_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ypcEp8pL10aPZT23GcfO2jpn3ALrJdP87e5pCgfThw6rzgjaEcblhdM2qoPufaE

