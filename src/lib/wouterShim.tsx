import { useCallback, useEffect } from 'react';
import {
  Link as RRLink,
  useLocation as useRRLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams,
} from 'react-router-dom';

type NavOptions = { replace?: boolean; state?: unknown };

/** بديل خفيف لمكتبة wouter مبني على react-router-dom حتى يعمل التوجيه داخل الراوتر الرئيسي. */
export function useLocation(): [string, (to: string, options?: NavOptions) => void] {
  const location = useRRLocation();
  const navigate = useNavigate();
  const setLocation = useCallback((to: string, options?: NavOptions) => {
    navigate(to, { replace: options?.replace, state: options?.state });
  }, [navigate]);
  return [location.pathname + location.search + location.hash, setLocation];
}

export function useParams<T = Record<string, string>>(): T {
  return useRRParams() as T;
}

export function useSearch(): string {
  const [params] = useSearchParams();
  const value = params.toString();
  return value ? '?' + value : '';
}

export function Link(props: any) {
  const { href, to, children, ...rest } = props;
  return <RRLink to={(href ?? to) as string} {...rest}>{children}</RRLink>;
}

export function Redirect(props: any) {
  const navigate = useNavigate();
  useEffect(() => { navigate((props.to ?? props.href) as string, { replace: props.replace }); }, []);
  return null;
}

export default { useLocation, useParams, useSearch, Link, Redirect };
