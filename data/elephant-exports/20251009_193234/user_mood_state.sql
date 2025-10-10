--
-- PostgreSQL database dump
--

\restrict 99Wrt2FUosgMzeCUvJbfhjlPpaAZXFVyPXLLS6R6lQ4Gu7k7ZPm6svvq5iXy0Fg

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
-- Data for Name: user_mood_state; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.user_mood_state (user_id, current_mood, mood_intensity, last_updated, mood_history) VALUES ('allan', 'excited', 8, '2025-10-06 07:20:31.549391', '[]');


--
-- PostgreSQL database dump complete
--

\unrestrict 99Wrt2FUosgMzeCUvJbfhjlPpaAZXFVyPXLLS6R6lQ4Gu7k7ZPm6svvq5iXy0Fg

