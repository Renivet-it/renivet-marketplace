export async function runConcurrentSearchTasks<TEmbedding, TRag>(
    embeddingTask: () => Promise<TEmbedding>,
    ragTask: () => Promise<TRag>
): Promise<[TEmbedding, TRag]> {
    return Promise.all([embeddingTask(), ragTask()]);
}
