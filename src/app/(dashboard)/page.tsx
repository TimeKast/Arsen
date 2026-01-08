import { auth } from '@/lib/auth/config';

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Dashboard
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder Cards */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ingresos del Mes
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        $0.00
                    </p>
                </div>

                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Costos del Mes
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        $0.00
                    </p>
                </div>

                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Utilidad
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                        $0.00
                    </p>
                </div>

                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Desviacion
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        0%
                    </p>
                </div>
            </div>

            {/* Welcome message */}
            <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-6">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Bienvenido, {session?.user?.name || 'Usuario'}
                </h2>
                <p className="mt-1 text-blue-700 dark:text-blue-300">
                    Rol: {session?.user?.role || 'READONLY'}
                </p>
            </div>
        </div>
    );
}
