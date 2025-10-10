--
-- PostgreSQL database dump
--

\restrict yhbIMJ30vzdRvSp08YnBq1Wwo0OWsemWhslSi2El19LzPc4ezeaqRq8mvNcyEmh

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
-- Data for Name: user_personality_state; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.user_personality_state (user_id, gandhi, flirty, turbo, auto, current_mood, last_updated) VALUES ('allan', 4, 7, 5, 10, 'excited', '2025-10-06 07:20:31.46874');


--
-- PostgreSQL database dump complete
--

\unrestrict yhbIMJ30vzdRvSp08YnBq1Wwo0OWsemWhslSi2El19LzPc4ezeaqRq8mvNcyEmh

