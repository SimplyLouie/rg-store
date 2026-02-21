import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { ProductFormData, StockAdjustment } from '../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params: any) => [...productKeys.lists(), { params }] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
    categories: () => [...productKeys.all, 'categories'] as const,
};

export const useProducts = (params?: { search?: string; category?: string; lowStock?: boolean }) => {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => productsApi.getAll(params),
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: productKeys.categories(),
        queryFn: productsApi.getCategories,
    });
};

export const useProductMutations = () => {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => productsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
            productsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });

    const adjustStockMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: StockAdjustment }) =>
            productsApi.adjustStock(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });

    return {
        createMutation,
        updateMutation,
        deleteMutation,
        adjustStockMutation,
    };
};
