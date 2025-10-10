--
-- PostgreSQL database dump
--

\restrict Z6kPcH7S10YFZMnYneLklNWP9ogZ6EUSFneIqtPgjVKQzqzUH1sUhc6yPKaQ9CQ

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
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.meetings (id, title, attendees, start_time, end_time, notes, transcript, action_items, deal_id) VALUES (1, 'Client Call #1', NULL, '2025-10-11 12:47:59.99196+00', NULL, 'Mock meeting notes 1', NULL, NULL, NULL);
INSERT INTO public.meetings (id, title, attendees, start_time, end_time, notes, transcript, action_items, deal_id) VALUES (2, 'Client Call #2', NULL, '2025-10-16 12:48:00.018649+00', NULL, 'Mock meeting notes 2', NULL, NULL, NULL);
INSERT INTO public.meetings (id, title, attendees, start_time, end_time, notes, transcript, action_items, deal_id) VALUES (3, 'Client Call #3', NULL, '2025-10-11 12:48:00.061271+00', NULL, 'Mock meeting notes 3', NULL, NULL, NULL);
INSERT INTO public.meetings (id, title, attendees, start_time, end_time, notes, transcript, action_items, deal_id) VALUES (4, 'Client Call #4', NULL, '2025-10-06 12:48:00.082527+00', NULL, 'Mock meeting notes 4', NULL, NULL, NULL);
INSERT INTO public.meetings (id, title, attendees, start_time, end_time, notes, transcript, action_items, deal_id) VALUES (5, 'Client Call #5', NULL, '2025-10-17 12:48:00.10957+00', NULL, 'Mock meeting notes 5', NULL, NULL, NULL);


--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aurora_app
--

SELECT pg_catalog.setval('public.meetings_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict Z6kPcH7S10YFZMnYneLklNWP9ogZ6EUSFneIqtPgjVKQzqzUH1sUhc6yPKaQ9CQ

