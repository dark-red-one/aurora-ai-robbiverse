--
-- PostgreSQL database dump
--

\restrict 9GZCH9xUkOUabsZ44Gc640lEywEVO2ncb5FpXCAiQKcxauqIXCUsca28UXNT7jy

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
-- Data for Name: conversation_context; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.conversation_context (id, session_id, "timestamp", role, content, metadata, content_hash, importance_score, context_type) VALUES (1, 'test', '2025-10-06 07:15:14.150337', 'user', 'I want to sync Google data with GPU acceleration', '{}', 'ac720014c1b3541768a8a0e065e0cae65492cb1b0658f9467f02b4225a5d8450', 1, 'general');
INSERT INTO public.conversation_context (id, session_id, "timestamp", role, content, metadata, content_hash, importance_score, context_type) VALUES (2, 'test', '2025-10-06 07:15:14.482093', 'assistant', 'Let''s use Ollama + RTX 4090 for massive data processing!', '{}', '67a172ac8e9c52a0aa548d2eaac0cd99cf96b5b4f96abb2a72e2c79e77b559ba', 1, 'general');
INSERT INTO public.conversation_context (id, session_id, "timestamp", role, content, metadata, content_hash, importance_score, context_type) VALUES (3, 'test', '2025-10-06 07:15:14.758587', 'system', 'We have unlimited RAM and GPU power - no more cursor limits!', '{}', '77eab20c6061d17767d259d7e6cc00959e04d9a9cf506446bfce6cc929241448', 1, 'general');


--
-- Name: conversation_context_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aurora_app
--

SELECT pg_catalog.setval('public.conversation_context_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 9GZCH9xUkOUabsZ44Gc640lEywEVO2ncb5FpXCAiQKcxauqIXCUsca28UXNT7jy

