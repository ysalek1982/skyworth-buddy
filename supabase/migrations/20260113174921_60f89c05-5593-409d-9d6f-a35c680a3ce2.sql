-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente', 'vendedor');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cedula TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  puntos_acumulados INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendedores table
CREATE TABLE public.vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cedula TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  tienda TEXT NOT NULL,
  codigo_vendedor TEXT NOT NULL UNIQUE,
  puntos_acumulados INTEGER NOT NULL DEFAULT 0,
  ventas_totales INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create productos table
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  modelo TEXT NOT NULL,
  puntos INTEGER NOT NULL,
  imagen_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compras table (purchase records)
CREATE TABLE public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  vendedor_id UUID REFERENCES public.vendedores(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  numero_factura TEXT NOT NULL,
  fecha_compra DATE NOT NULL,
  puntos_otorgados INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  foto_factura_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create premios table
CREATE TABLE public.premios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  puntos_requeridos INTEGER NOT NULL,
  imagen_url TEXT,
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create canjes table (reward redemptions)
CREATE TABLE public.canjes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.vendedores(id) ON DELETE CASCADE,
  premio_id UUID REFERENCES public.premios(id) ON DELETE SET NULL NOT NULL,
  puntos_utilizados INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_usuario CHECK (cliente_id IS NOT NULL OR vendedor_id IS NOT NULL)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendedores_updated_at
  BEFORE UPDATE ON public.vendedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, apellido, telefono)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'telefono', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clientes
CREATE POLICY "Clientes can view their own data"
  ON public.clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes can update their own data"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register as cliente"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clientes"
  ON public.clientes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vendedores
CREATE POLICY "Vendedores can view their own data"
  ON public.vendedores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendedores can update their own data"
  ON public.vendedores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register as vendedor"
  ON public.vendedores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendedores"
  ON public.vendedores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for productos (public read)
CREATE POLICY "Anyone can view active products"
  ON public.productos FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins can manage products"
  ON public.productos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for compras
CREATE POLICY "Clientes can view their own purchases"
  ON public.compras FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clientes 
    WHERE clientes.id = compras.cliente_id 
    AND clientes.user_id = auth.uid()
  ));

CREATE POLICY "Vendedores can view their related sales"
  ON public.compras FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vendedores 
    WHERE vendedores.id = compras.vendedor_id 
    AND vendedores.user_id = auth.uid()
  ));

CREATE POLICY "Clientes can register purchases"
  ON public.compras FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clientes 
    WHERE clientes.id = cliente_id 
    AND clientes.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all purchases"
  ON public.compras FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for premios (public read)
CREATE POLICY "Anyone can view active prizes"
  ON public.premios FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins can manage prizes"
  ON public.premios FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for canjes
CREATE POLICY "Users can view their own redemptions"
  ON public.canjes FOR SELECT
  USING (
    (cliente_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clientes 
      WHERE clientes.id = cliente_id 
      AND clientes.user_id = auth.uid()
    ))
    OR
    (vendedor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.vendedores 
      WHERE vendedores.id = vendedor_id 
      AND vendedores.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create redemptions"
  ON public.canjes FOR INSERT
  WITH CHECK (
    (cliente_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clientes 
      WHERE clientes.id = cliente_id 
      AND clientes.user_id = auth.uid()
    ))
    OR
    (vendedor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.vendedores 
      WHERE vendedores.id = vendedor_id 
      AND vendedores.user_id = auth.uid()
    ))
  );

CREATE POLICY "Admins can manage all redemptions"
  ON public.canjes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert sample products (Skyworth TVs)
INSERT INTO public.productos (nombre, modelo, puntos, activo) VALUES
  ('Skyworth 32"', 'SKW-32HD', 50, true),
  ('Skyworth 43" FHD', 'SKW-43FHD', 100, true),
  ('Skyworth 50" 4K', 'SKW-50UHD', 150, true),
  ('Skyworth 55" 4K', 'SKW-55UHD', 200, true),
  ('Skyworth 65" 4K', 'SKW-65UHD', 300, true),
  ('Skyworth 75" 4K', 'SKW-75UHD', 400, true),
  ('Skyworth 85" 4K', 'SKW-85UHD', 500, true);

-- Insert sample prizes
INSERT INTO public.premios (nombre, descripcion, puntos_requeridos, cantidad_disponible, activo) VALUES
  ('Camiseta Oficial', 'Camiseta oficial de la selección', 100, 500, true),
  ('Balón de Fútbol', 'Balón oficial del Mundial 2026', 200, 200, true),
  ('Jersey Firmado', 'Jersey firmado por jugadores', 500, 50, true),
  ('Entrada al Mundial', 'Entrada para un partido del Mundial 2026', 1000, 20, true),
  ('Viaje al Mundial', 'Paquete completo viaje al Mundial 2026', 5000, 5, true);