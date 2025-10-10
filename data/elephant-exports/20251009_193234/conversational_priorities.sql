--
-- PostgreSQL database dump
--

\restrict Fp2xXuWeKMEe53q31qaHNKKewaf1uQBeK4q3QX15GszKihumd5OaJT0BQN1GM7C

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
-- Data for Name: conversational_priorities; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.conversational_priorities (id, user_id, priority_type, priority_content, weight, active, created_at, updated_at) VALUES (1, 'allan', 'sales_content', 'AI agents sales content', 8, true, '2025-10-06 08:00:25.072433', '2025-10-06 08:00:25.072433');
INSERT INTO public.conversational_priorities (id, user_id, priority_type, priority_content, weight, active, created_at, updated_at) VALUES (2, 'allan', 'business_critical', 'TestPilot CPG revenue deals', 10, true, '2025-10-06 08:00:25.072433', '2025-10-06 08:00:25.072433');
INSERT INTO public.conversational_priorities (id, user_id, priority_type, priority_content, weight, active, created_at, updated_at) VALUES (3, 'allan', 'infrastructure', 'server alerts security issues', 7, true, '2025-10-06 08:00:25.072433', '2025-10-06 08:00:25.072433');
INSERT INTO public.conversational_priorities (id, user_id, priority_type, priority_content, weight, active, created_at, updated_at) VALUES (4, 'allan', 'development', 'GitHub commits code reviews', 6, true, '2025-10-06 08:00:25.072433', '2025-10-06 08:00:25.072433');
INSERT INTO public.conversational_priorities (id, user_id, priority_type, priority_content, weight, active, created_at, updated_at) VALUES (5, 'allan', 'robbie_development', 'Robbie AI personality improvements', 9, true, '2025-10-06 08:00:25.072433', '2025-10-06 08:00:25.072433');


--
-- Name: conversational_priorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aurora_app
--

SELECT pg_catalog.setval('public.conversational_priorities_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict Fp2xXuWeKMEe53q31qaHNKKewaf1uQBeK4q3QX15GszKihumd5OaJT0BQN1GM7C

