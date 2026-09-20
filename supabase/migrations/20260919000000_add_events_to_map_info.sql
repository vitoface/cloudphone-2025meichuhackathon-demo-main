create type public.map_event as enum (
  'car_crash',
  'traffic_jam',
  'roadwork',
  'unknown_danger',
  'natural_disaster'
);

alter table public."MapInfo"
add column events public.map_event;;
