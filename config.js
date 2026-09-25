// Chave pública do Supabase. É anon por definição: fica no navegador de quem
// responde e só consegue o que as políticas de acesso permitem — ler quiz ativo
// e chamar submit_quiz. Não dá acesso a lead nem a resposta de ninguém.
window.QUIZ_CONFIG = {
  url:  'https://gqibxdwvagjvvhixmcsg.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaWJ4ZHd2YWdqdnZoaXhtY3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODQ4MzIsImV4cCI6MjEwNTg2MDgzMn0.W1J5Ykd5zg5KmyQ91Hzas2NfAZytJmIgmfi8SwBWLyw',
  slug: 'insonia'
};
