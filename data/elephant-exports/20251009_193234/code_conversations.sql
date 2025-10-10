--
-- PostgreSQL database dump
--

\restrict P3esAZEH5QV57rdWM2FTfaWfTcF86yboqA7o3S8vA9WgLkG3Bv9AzgCueFB0uDj

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
-- Data for Name: code_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.code_conversations (id, user_id, session_id, title, context_type, created_at, updated_at, last_message_at, message_count, metadata) VALUES ('aea13da0-a48f-4302-947b-7da63bb94fbb', 'allan', 'session_b1fd4360-4e0c-4175-b133-69af62629932', 'Test Conversation', 'code', '2025-10-08 18:51:50.61202+00', '2025-10-08 18:51:50.61202+00', '2025-10-08 18:51:50.61202+00', 2, '{}');


--
-- PostgreSQL database dump complete
--

\unrestrict P3esAZEH5QV57rdWM2FTfaWfTcF86yboqA7o3S8vA9WgLkG3Bv9AzgCueFB0uDj

