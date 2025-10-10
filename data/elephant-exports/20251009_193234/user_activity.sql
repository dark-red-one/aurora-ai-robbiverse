--
-- PostgreSQL database dump
--

\restrict wvVJYtoDbILjFZLzjQhVIbidE1yWhdXbnnHe9cra5NvzNAvar2Zi7W9vk2dbzmt

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
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.user_activity (id, user_id, activity_type, details, created_at) VALUES ('d50faaa2-7347-4c78-9c6f-139bfa3e53ff', 'allan', 'test', '{"test_type": "personality_logger", "timestamp": "2025-10-06T02:20:35.408642"}', '2025-10-06 07:20:35.538203');
INSERT INTO public.user_activity (id, user_id, activity_type, details, created_at) VALUES ('0be306bc-b43a-4375-aa7d-9ce51918bd57', 'allan', 'query', '{"mood": {"mood": "excited", "intensity": 8}, "query": "Hello Robbie!", "personality": {"auto": 10, "mood": "excited", "turbo": 5, "flirty": 7, "gandhi": 4}}', '2025-10-06 07:20:36.570222');


--
-- PostgreSQL database dump complete
--

\unrestrict wvVJYtoDbILjFZLzjQhVIbidE1yWhdXbnnHe9cra5NvzNAvar2Zi7W9vk2dbzmt

