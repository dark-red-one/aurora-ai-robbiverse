--
-- PostgreSQL database dump
--

\restrict qCZmqxRW2NUZYkyaMnJpw4xiZlvW4M1YIssLqd42rtL72rea1f7G0V38ER7H7Xc

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at) VALUES (1, 'allan@testpilotcpg.com', 'Allan Peretz', 'admin', true, '2025-10-09 21:32:29.275422', '2025-10-09 21:32:29.275422');


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict qCZmqxRW2NUZYkyaMnJpw4xiZlvW4M1YIssLqd42rtL72rea1f7G0V38ER7H7Xc

