import setuptools

setuptools.setup(
    name='flake-python',
    version='1.0.1',
    author='Letsmoe',
    author_email='letsmoe1404@gmail.com',
    packages=setuptools.find_packages(),
    scripts=[],
	python_requires=">=3.6",
    url='http://pypi.python.org/pypi/flake-python/',
    license='LICENSE',
    description='Tools for executing tests in Python with @flake-universal',
    long_description=open('README.md').read(),
    install_requires=["watchpoints"],
)
