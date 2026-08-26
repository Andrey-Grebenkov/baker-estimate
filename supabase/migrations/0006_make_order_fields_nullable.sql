-- Разрешаем быструю запись заказа: торт, вес и имя клиента могут быть заполнены позже.

ALTER TABLE public.orders
  ALTER COLUMN client_name DROP NOT NULL,
  ALTER COLUMN actual_weight_kg DROP NOT NULL;
