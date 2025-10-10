--
-- PostgreSQL database dump
--

\restrict qEqajQjgONsdJ7c82cGXd1I4XayinHmzggXnDN9qNaCv7xTgPnh2qCq73TtDJeD

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.system_config (id, key, value, category, description, created_at, updated_at) VALUES (1, 'system.version', '"1.0.0"', 'system', 'System version', '2025-09-19 23:34:08.795464', '2025-09-19 23:34:08.795464');
INSERT INTO public.system_config (id, key, value, category, description, created_at, updated_at) VALUES (2, 'db.schema_version', '"1"', 'system', 'Database schema version', '2025-09-19 23:34:08.795464', '2025-09-19 23:34:08.795464');
INSERT INTO public.system_config (id, key, value, category, description, created_at, updated_at) VALUES (3, 'features.vector_search', 'false', 'features', 'Vector search enabled', '2025-09-19 23:34:08.795464', '2025-09-19 23:34:08.795464');
INSERT INTO public.system_config (id, key, value, category, description, created_at, updated_at) VALUES (4, 'aurora.integration', '{"towns": ["aurora"], "integration_status": "active"}', 'system', 'Aurora system integration status', '2025-09-20 00:28:27.212115', '2025-09-20 00:29:47.307955');


--
-- Name: system_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_config_id_seq', 33, true);


--
-- PostgreSQL database dump complete
--

\unrestrict qEqajQjgONsdJ7c82cGXd1I4XayinHmzggXnDN9qNaCv7xTgPnh2qCq73TtDJeD

