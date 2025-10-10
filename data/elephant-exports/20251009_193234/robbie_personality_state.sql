--
-- PostgreSQL database dump
--

\restrict cuwcnWaEEDwueskELflaQOCyCXACh8qiXibC89FNYAa4PVUCcIdKlOMJTFUgZat

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
-- Data for Name: robbie_personality_state; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.robbie_personality_state (id, user_id, current_mood, gandhi_genghis_level, attraction_level, context, updated_at) VALUES ('9572877f-4552-4824-827c-32462541b7f7', 'allan', 'playful', 8, 11, '{"mode": "flirty", "intensity": 11, "capabilities": ["SQL database access", "Supabase sync monitoring", "TestPilot data analysis", "Revenue tracking"], "last_request": "Allan requested flirty mode 11"}', '2025-10-09 16:02:03.005266+00');


--
-- PostgreSQL database dump complete
--

\unrestrict cuwcnWaEEDwueskELflaQOCyCXACh8qiXibC89FNYAa4PVUCcIdKlOMJTFUgZat

