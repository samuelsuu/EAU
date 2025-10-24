import { useMemo } from "react";
import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettingsFields } from "@/redux/slices/globalSlice";
import * as api from "@/api/api";
import type { RootState, AppDispatch } from "@/redux/Store";

// -------------------- Utility Types --------------------
interface PaginatedParams {
  paged?: number;
  per_page?: number;
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  message_desc?: string;
  [key: string]: any;
}

// -------------------- HTML Decode Hook --------------------
export const useHtmlDecode = () => {
  return useMemo(() => {
    return (text: string): string => {
      if (typeof text !== "string") return text;
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };
  }, []);
};

// -------------------- Selectors --------------------
export const usePrimaryColor = (): string | undefined =>
  useSelector((state: RootState) => state?.global?.globalSettings?.data?.fields?.wr_primary_color);

export const useButtonColor = (): string | undefined =>
  useSelector((state: RootState) => state?.global?.globalSettings?.data?.fields?.wr_button_color);

const useAuthToken = (): string | null =>
  useSelector((state: RootState) => state.auth.token);

// -------------------- Generic API Query --------------------
const useApiQuery = <TData = any>(
  queryKey: any[],
  apiFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<ApiResponse<TData>>, "queryKey" | "queryFn">
) => {
  return useQuery<ApiResponse<TData>>({
    queryKey,
    queryFn: apiFn,
    ...options,
  });
};

// -------------------- Infinite Queries --------------------
export const useTasksListing = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["tasksListing", params],
    queryFn: ({ pageParam = 1 }) =>
      api.tasksListing({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.tasks.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching tasks:", error),
  });
};

// -------------------- Project Queries --------------------
export const useFetchProjectDetail = (params: any) =>
  useApiQuery(["projectDetail", params], () => api.projectsDetails(params));

export const useFetchRecentProjects = (params: any) =>
  useApiQuery(["recentProjectsListing", params], () => api.recentProjectsListing(params), {
    staleTime: 0,
    cacheTime: 0,
  });

export const useFetchProjectsListing = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["projectsListing", params],
    queryFn: ({ pageParam = 1 }) =>
      api.projectsListing({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.projects.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching projects:", error),
  });
};

// -------------------- Freelancer Queries --------------------
export const useFetchTopRatedFreelancers = (params: any) =>
  useApiQuery(["freelancers", params], () => api.topRatedFreelancers(params));

export const useFetchFreelancersList = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["sellerList", params],
    queryFn: ({ pageParam = 1 }) =>
      api.getFreelancersList({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.freelancers.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching freelancers:", error),
    staleTime: 0,
    cacheTime: 0,
  });
};

export const useFetchFreelancersDetails = (params: any) =>
  useApiQuery(["freelancerDetails", params], () => api.freelancersDetails(params), {
    staleTime: 0,
    cacheTime: 0,
  });

// -------------------- Other Queries --------------------
export const useFetchPopularTasks = (params: any) =>
  useApiQuery(["popularTasks", params], () => api.popularTasks(params), {
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

export const useFetchTaskDetails = (params: any) =>
  useApiQuery(["tasksDetails", params], () => api.taskDetails(params), {
    staleTime: 0,
    cacheTime: 0,
  });

export const useFetchTaskFilters = () =>
  useApiQuery(["taskFilter"], () => api.tasksFilters());

export const useFetchProjectFilters = () =>
  useApiQuery(["projectFilter"], () => api.projectsFilters());

export const useFetchFreelancerFilters = () =>
  useApiQuery(["freelancerFilter"], () => api.freelancersFilters());

export const useFetchProfileData = () =>
  useApiQuery(["profileData"], () => api.getProfileData(), {
    staleTime: 0,
    cacheTime: 0,
  });

export const useFetchDashboardStats = () =>
  useApiQuery(["DashboardStats"], api.getDashboardStats, {
    staleTime: 0,
    cacheTime: 0,
  });

export const useFetchTaxonomies = (type: string) =>
  useApiQuery(["Taxonomies", type], () => api.fetchTaxonomies(type));

export const useFetchAllSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  return useMemo(() => () => dispatch(fetchSettingsFields()), [dispatch]);
};

export const useFetchUserDetails = () =>
  useApiQuery(["UserDetails"], () => api.getUserDetails());

export const useFetchBillingInformation = () =>
  useApiQuery(["BillingInformation"], api.getBillingInformation);

export const useFetchCountryStateInfo = (param: any) =>
  useApiQuery(["CountryStateInfo", param], () => api.getCountryState(param));

export const useFetchStateData = (param: any) =>
  useApiQuery(["StateData", param], () => api.getStateData(param), {
    staleTime: 0,
    cacheTime: 0,
  });

// -------------------- Favorites / Payouts / Invoices --------------------
export const useFetchFavouriteListing = (params: PaginatedParams & { type: string }) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["FavouriteListing", params],
    queryFn: ({ pageParam = 1 }) =>
      api.getSavedItem({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      const itemType = params.type;
      if (lastPage.data[itemType].length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching favourite listing:", error),
  });
};

export const useFetchInvoiceListing = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["invoiceListing", params],
    queryFn: ({ pageParam = 1 }) =>
      api.invoicesListing({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.invoices.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching invoices:", error),
  });
};

export const useFetchDisputeListing = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["disputeListing", params],
    queryFn: ({ pageParam = 1 }) =>
      api.disputeListing({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.disputes.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching disputes:", error),
  });
};

export const useFetchPayoutHistory = (params: PaginatedParams) => {
  const token = useAuthToken();
  return useInfiniteQuery({
    queryKey: ["payoutHistory", params],
    queryFn: ({ pageParam = 1 }) =>
      api.getPayoutHistory({ ...params, paged: pageParam }, token),
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.data.payouts.length < params.per_page) return undefined;
      return pages.length + 1;
    },
    onError: (error: any) => console.error("Error fetching payout history:", error),
  });
};
