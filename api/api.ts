import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "@/redux/Store";
import { showAlert } from "@/redux/slices/alertSlice";

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: "https://ebuyartisannetwork.com/wp-json/wr/v1/",
  timeout: 15000,
});

/**
 * Automatically attach Bearer token if available
 */
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Reusable API caller
 */
const apiCall = async (
  method: AxiosRequestConfig["method"],
  url: string,
  data?: any,
  params?: any,
  headers: Record<string, string> = {}
): Promise<AxiosResponse<any>> => {
  try {
    const response = await api({ method, url, data, params, headers });
    return response;
  } catch (error: any) {
    const response = error.response;

    if (response?.status === 403) {
      store.dispatch(
        showAlert({
          type: "error",
          message: response?.data?.message || "Access denied",
          message_desc: response?.data?.data?.message_desc,
          buttonText2: "Close",
          showLoginButton: false,
          statusCode: response?.status,
        })
      );
    } else if (response?.status === 401) {
      store.dispatch(
        showAlert({
          type: "error",
          message: response?.data?.message || "Unauthorized",
          message_desc: response?.data?.data?.message_desc,
          buttonText2: "Login again",
          showLoginButton: true,
          statusCode: response?.status,
        })
      );
    } else {
      throw response || { message: "An unknown error occurred" };
    }

    throw error;
  }
};

/**
 * ========== AUTHENTICATION ==========
 */

// Login function with email preservation
export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const payload = {
      user_email: data.email,
      password: data.password,
    };

    console.log('🔄 Attempting login with:', { user_email: payload.user_email });
    
    const response = await api.post('auth/login', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add the email to the response data for easy access
    if (response.data?.user) {
      response.data.user.email = data.email;
      response.data.user.user_email = data.email;
    }
    
    console.log('✅ Login successful');
    console.log('👤 User data with email:', response.data?.user);
    
    return response;
  } catch (error: any) {
    console.error('❌ Login API error:', error?.response?.data || error.message);
    throw error;
  }
};

export const registerUser = (data: any) => apiCall("post", "auth/register", data);
export const resendEmailVerification = () => apiCall("post", "auth/resend-email");
export const sendResentEmailLink = (data: any) => apiCall("post", "auth/reset-password", data);
export const switchRole = () => apiCall("post", "auth/switch-user");

// Password change with correct field names
export const updatePassword = async (data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  try {
    console.log('🔐 Password change request');
    const response = await apiCall("post", "auth/change-password", data);
    console.log('✅ Password change response:', response.data);
    return response;
  } catch (error: any) {
    console.error('❌ Password change error:', error);
    throw error;
  }
};

/**
 * ========== USER / PROFILE ==========
 */
export const getUserDetails = () => apiCall("get", "auth/user-detail");
export const getProfileData = () => apiCall("get", "user/profile");
export const updateProfileData = (data: any) => apiCall("post", "user/profile/update", data);
export const updateProfileImage = (formData: any) =>
  apiCall("post", "user/profile/image", formData, null, {
    "Content-Type": "multipart/form-data",
  });

export const updateExperienceDetails = (data: any) =>
  apiCall("post", "user/profile/experience", data);
export const updateEducationDetails = (data: any) =>
  apiCall("post", "user/profile/education", data);
export const deleteFreelancersExperience = (data: any) =>
  apiCall("delete", "user/profile/experience", data);
export const deleteFreelancersEducation = (data: any) =>
  apiCall("delete", "user/profile/education", data);

/**
 * ========== DASHBOARD / BILLING ==========
 */
export const getDashboardStats = () => apiCall("get", "user/dashboard");
export const getBillingInformation = () => apiCall("get", "user/billing");
export const updateBillingInformation = (data: any) =>
  apiCall("post", "user/billing/update", data);

/**
 * ========== PROJECTS / TASKS ==========
 */
export const fetchSettings = () => apiCall("get", "settings");
export const fetchTaxonomies = (type: string) =>
  apiCall(
    "get",
    `taxonomy/terms?slug=${type}${type === "product_cat" ? "&parent=0" : ""}`
  );

export const popularTasks = (params?: any) => apiCall("get", "task/popular", null, params);
export const recentProjectsListing = (params?: any) =>
  apiCall("get", "project/recent", null, params);
export const tasksListing = (params?: any) => apiCall("get", "tasks", null, params);
export const taskDetails = (id: string) => apiCall("get", `task/${id}`);
export const projectsListing = (params?: any) => apiCall("get", "projects", null, params);
export const projectsDetails = (id: string) => apiCall("get", `project/${id}`);
export const tasksFilters = () => apiCall("get", "task/filters");
export const projectsFilters = () => apiCall("get", "project/filters");

/**
 * ========== FREELANCERS ==========
 */
export const getFreelancersList = (params?: any) =>
  apiCall("get", "freelancers", null, params);
export const freelancersDetails = (id: string) => apiCall("get", `freelancer/${id}`);
export const freelancersFilters = () => apiCall("get", "freelancer/filters");
export const topRatedFreelancers = (params?: any) =>
  apiCall("get", "freelancer/top-rated", null, params);

/**
 * ========== ACCOUNT SETTINGS ==========
 */
export const updatePrivacyInfo = (data: any) =>
  apiCall("post", "setting/profile-visibility", data);
export const deActivateAccount = (data: any) =>
  apiCall("post", "setting/deactivate-account", data);
export const activateAccount = () => apiCall("post", "setting/activate-account");

/**
 * ========== PAYOUTS / INVOICES ==========
 */
export const withdrawMoney = (data: any) =>
  apiCall("post", "user/withdraw-request", data);
export const upDatePaymentMethod = (data: any) =>
  apiCall("post", "user/payout-method", data);
export const removePaymentMethod = (data: any) =>
  apiCall("delete", "user/payout-method", data);
export const getPayoutHistory = (params?: any) =>
  apiCall("get", "user/payouts", null, params);
export const invoicesListing = (params?: any) =>
  apiCall("get", "user/invoices", null, params);

/**
 * ========== SAVED ITEMS / PROPOSALS ==========
 */
export const getSavedItem = (params?: any) => apiCall("get", "user/saved", null, params);
export const addSavedItem = (data: any) => apiCall("post", "user/save", data);
export const removeSavedItem = (data: any) =>
  apiCall("delete", "user/remove-save", data);
export const proposalSubmission = (data: any) => apiCall("post", "user/proposal", data);

/**
 * ========== VERIFICATION ==========
 */
export const updateIdentityInformation = (formData: any) =>
  apiCall("post", "user/verification/submit", formData, null, {
    "Content-Type": "multipart/form-data",
  });
export const cancelIdentityVerification = () =>
  apiCall("post", "user/verification/cancel");

/**
 * ========== DISPUTES ==========
 */
export const disputeListing = (params?: any) =>
  apiCall("get", "user/disputes", null, params);

/**
 * ========== MESSAGING ==========
 */

// Send a message to another user
export const sendMessage = async (data: {
  receiver_id: string;
  message: string;
  activity_id?: string;
}) => {
  try {
    console.log('💬 Sending message to:', data.receiver_id);
    
    // The backend requires activity_id - use receiver_id as activity_id if not provided
    const payload = {
      activity_id: data.activity_id || data.receiver_id,
      receiver_id: data.receiver_id,
      message: data.message,
    };
    
    console.log('📤 Message payload:', payload);
    
    const response = await apiCall("post", "user/activity/submit-message", payload);
    
    console.log('✅ Message sent successfully');
    return response;
  } catch (error: any) {
    console.error('❌ Send message error:', error?.response?.data || error);
    throw error;
  }
};

// Get all conversations
export const getConversations = async () => {
  try {
    const response = await apiCall("get", "user/activity/conversations");
    return response;
  } catch (error: any) {
    console.error('❌ Get conversations error:', error);
    throw error;
  }
};

// Get messages with a specific user
export const getMessages = async (userId: string) => {
  try {
    const response = await apiCall("get", `user/activity/messages/${userId}`);
    return response;
  } catch (error: any) {
    console.error('❌ Get messages error:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const response = await apiCall("post", "user/activity/mark-read", {
      conversation_id: conversationId,
    });
    return response;
  } catch (error: any) {
    console.error('❌ Mark messages as read error:', error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId: string) => {
  try {
    const response = await apiCall("delete", `user/activity/conversation/${conversationId}`);
    return response;
  } catch (error: any) {
    console.error('❌ Delete conversation error:', error);
    throw error;
  }
};