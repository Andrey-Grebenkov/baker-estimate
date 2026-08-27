UPDATE public.cakes
SET recipes = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN jsonb_typeof(elem) = 'object' THEN jsonb_set(elem, '{multiplier}', to_jsonb(1))
        ELSE elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(recipes) AS elem
)
WHERE recipes IS NOT NULL
  AND jsonb_typeof(recipes) = 'array';
